/**
 * CSV (Google Sheets export) → catalog. One row per engine variant; rows of the same model are contiguous
 * and share model-level columns (repeat them or leave them blank on follow-up rows).
 *
 * Every group of fields has its own source title, URL and retrieval date. Outcome per model:
 * - invalid value (bad number, URL, date, enum, inverted range, duplicate id, conflict) → error, nothing is written;
 * - missing value or missing source → "incomplete", not published, listed in the report;
 * - complete → published; if `verification` is not "verified" it is published with `verified: false`
 *   (shown as "în curs de verificare", not indexed) and listed in the report.
 * Runs in Node via type stripping, so runtime imports use explicit .ts extensions.
 */
import { semanticErrors, V1_ENERGIES } from "./dataChecks.ts";
import type { Body, CarModel, Catalog, Engine, Source } from "./types";

/** [group, value columns]. Each group has <group>_source_title, <group>_source_url and <group>_date columns. */
const GROUPS = [
  ["years", ["year_from", "year_to"]],
  ["body", ["body"]],
  ["seats", ["seats"]],
  ["trunk", ["trunk_l"]],
  ["engine", ["energy", "cc", "hp", "consumption_l100km"]],
  ["price", ["price_min_eur", "price_max_eur"]],
] as const;

const sourceCols = (g: string) =>
  [`${g}_source_title`, `${g}_source_url`, `${g}_date`] as const;

export const COLUMNS = [
  "id",
  "brand",
  "model",
  "generation",
  "example",
  "verification",
  ...GROUPS.flatMap(([g, cols]) => [...cols, ...sourceCols(g)]),
] as const;

type Col = (typeof COLUMNS)[number];
type Row = Record<Col, string> & { line: number; file: string };

export interface RowIssue {
  file: string;
  line: number;
  id: string;
  message: string;
}

export interface ImportResult {
  /** Present when there are no errors. Contains only complete models. */
  catalog?: Catalog;
  errors: RowIssue[];
  incomplete: { id: string; file: string; line: number; missing: string[] }[];
  unverified: string[];
}

export const VERIFIED = "verified";
export const NEEDS_VERIFICATION = "needs verification";

const ENGINE_COLS: Col[] = [
  "energy",
  "cc",
  "hp",
  "consumption_l100km",
  ...sourceCols("engine"),
];
const MODEL_COLS = COLUMNS.filter((c) => !ENGINE_COLS.includes(c));
const BODIES: Body[] = ["hatchback", "sedan", "break", "suv", "mpv"];

/** Minimal RFC 4180 parser: quoted fields, escaped quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  const endField = () => {
    row.push(field);
    field = "";
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") endField();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      endField();
      rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    endField();
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const isDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const isUrl = (s: string) => {
  try {
    return /^https?:$/.test(new URL(s).protocol);
  } catch {
    return false;
  }
};

function readRows(file: string, text: string, errors: RowIssue[]): Row[] {
  const table = parseCsv(text);
  if (table.length === 0) {
    errors.push({ file, line: 1, id: "", message: "empty file" });
    return [];
  }
  const header = table[0].map((h) => h.trim());
  const missingCols = COLUMNS.filter((c) => !header.includes(c));
  if (missingCols.length) {
    errors.push({
      file,
      line: 1,
      id: "",
      message: `missing columns: ${missingCols.join(", ")}`,
    });
    return [];
  }
  return table.slice(1).map((cells, i) => {
    const r = { line: i + 2, file } as Row;
    for (const c of COLUMNS) r[c] = (cells[header.indexOf(c)] ?? "").trim();
    return r;
  });
}

export function csvToCatalog(
  files: { name: string; text: string }[],
  opts: { updated: string; previous?: Catalog },
): ImportResult {
  const errors: RowIssue[] = [];
  const incomplete: ImportResult["incomplete"] = [];
  const unverified: string[] = [];

  // Group contiguous rows by id; a non-contiguous repeat (also across files) is a duplicate id.
  const groups: Row[][] = [];
  const first = new Map<string, Row>();
  for (const { name, text } of files) {
    let last: Row[] | undefined;
    for (const r of readRows(name, text, errors)) {
      const err = (message: string) =>
        errors.push({ file: r.file, line: r.line, id: r.id, message });
      if (!r.id) {
        err("missing id");
        continue;
      }
      if (last && last[0].id === r.id) {
        for (const c of MODEL_COLS)
          if (r[c] === "") r[c] = last[0][c];
          else if (r[c] !== last[0][c])
            err(
              `${c} "${r[c]}" conflicts with line ${last[0].line} ("${last[0][c]}")`,
            );
        last.push(r);
      } else if (first.has(r.id)) {
        const f = first.get(r.id)!;
        err(`duplicate id (first used on ${f.file} line ${f.line})`);
      } else {
        first.set(r.id, r);
        last = [r];
        groups.push(last);
      }
    }
  }

  const previous = new Map(opts.previous?.models.map((m) => [m.id, m]));
  const models: CarModel[] = [];

  for (const group of groups) {
    const head = group[0];
    const errBefore = errors.length;
    const missing: string[] = [];
    const err = (r: Row, message: string) =>
      errors.push({ file: r.file, line: r.line, id: head.id, message });
    /** Positive whole number, or NaN (recorded as missing / invalid). */
    const int = (r: Row, c: Col) => {
      if (r[c] === "") {
        missing.push(
          group.length > 1 && ENGINE_COLS.includes(c)
            ? `${c} (line ${r.line})`
            : c,
        );
        return NaN;
      }
      const n = Number(r[c]);
      if (!Number.isInteger(n) || n <= 0)
        err(r, `${c} must be a positive whole number, got "${r[c]}"`);
      return n;
    };

    for (const c of ["brand", "model", "generation"] as const)
      if (!head[c]) missing.push(c);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(head.id))
      err(head, "id must be lowercase kebab-case");
    if (!["", "true", "false"].includes(head.example))
      err(head, "example must be true, false or empty");
    if (![VERIFIED, NEEDS_VERIFICATION, ""].includes(head.verification))
      err(
        head,
        `verification must be "${VERIFIED}" or "${NEEDS_VERIFICATION}"`,
      );

    // Sources: a value needs title + URL + date; format errors are always reported.
    for (const r of group)
      for (const [g, cols] of GROUPS) {
        if (r !== head && g !== "engine") continue;
        const [t, u, d] = sourceCols(g) as unknown as Col[];
        if (r[u] && !isUrl(r[u])) err(r, `${u} is not a valid http(s) URL`);
        if (r[d] && !isDate(r[d]))
          err(r, `${d} must be YYYY-MM-DD, got "${r[d]}"`);
        if (!cols.some((c) => r[c] !== "")) continue;
        for (const c of [t, u, d])
          if (!r[c])
            missing.push(
              group.length > 1 && g === "engine" ? `${c} (line ${r.line})` : c,
            );
      }

    if (head.body && !(BODIES as string[]).includes(head.body))
      err(head, `body must be one of ${BODIES.join("/")}`);
    else if (!head.body) missing.push("body");

    const years = { from: int(head, "year_from"), to: int(head, "year_to") };
    if (years.from > years.to)
      err(head, `year_from ${years.from} > year_to ${years.to}`);
    const seats = int(head, "seats");
    const trunk = int(head, "trunk_l");
    const price = {
      min: int(head, "price_min_eur"),
      max: int(head, "price_max_eur"),
    };
    if (price.min > price.max)
      err(head, `price_min_eur ${price.min} > price_max_eur ${price.max}`);

    const engines: Engine[] = group.map((r) => {
      if (!r.energy)
        missing.push(group.length > 1 ? `energy (line ${r.line})` : "energy");
      else if (!(V1_ENERGIES as readonly string[]).includes(r.energy))
        err(
          r,
          `energy must be one of ${V1_ENERGIES.join("/")}, got "${r.energy}"`,
        );
      let consumption = NaN;
      if (!r.consumption_l100km)
        missing.push(
          group.length > 1
            ? `consumption_l100km (line ${r.line})`
            : "consumption_l100km",
        );
      else {
        consumption = Number(r.consumption_l100km.replace(",", "."));
        if (!(consumption > 0 && consumption <= 40))
          err(
            r,
            `consumption_l100km must be a number in (0, 40], got "${r.consumption_l100km}"`,
          );
      }
      return {
        energy: r.energy as Engine["energy"],
        cc: int(r, "cc"),
        hp: int(r, "hp"),
        consumption: { value: consumption, unit: "l/100km" },
      };
    });

    if (errors.length > errBefore) continue;
    if (missing.length) {
      incomplete.push({
        id: head.id,
        file: head.file,
        line: head.line,
        missing: [...new Set(missing)],
      });
      continue;
    }
    const example = head.example === "true";
    const verified = example || head.verification === VERIFIED;
    if (!verified) unverified.push(head.id);

    // One source entry per URL, with the most recent retrieval date.
    const sources = new Map<string, Source>();
    for (const r of group)
      for (const [g] of GROUPS) {
        const [t, u, d] = sourceCols(g) as unknown as Col[];
        if (!r[u]) continue;
        const prev = sources.get(r[u]);
        if (!prev || prev.accessed < r[d])
          sources.set(r[u], { title: r[t], url: r[u], accessed: r[d] });
      }

    const old = previous.get(head.id);
    models.push({
      id: head.id,
      ...(example ? { example: true } : {}),
      verified,
      brand: head.brand,
      model: head.model,
      generation: head.generation,
      years,
      body: head.body as Body,
      engines,
      seats,
      trunk_l: trunk,
      price_eur: { ...price, set_on: head.price_date },
      sources: [...sources.values()],
      // V2 fields are not in the CSV; keep what already exists.
      pros: old?.pros ?? [],
      cons: old?.cons ?? [],
      known_issues: old?.known_issues ?? [],
    });
  }

  if (errors.length) return { errors, incomplete, unverified };
  const catalog: Catalog = { updated: opts.updated, models };
  for (const message of semanticErrors(catalog)) {
    const id = message.split(":")[0];
    const r = first.get(id);
    errors.push({ file: r?.file ?? "", line: r?.line ?? 0, id, message });
  }
  return errors.length
    ? { errors, incomplete, unverified }
    : { catalog, errors, incomplete, unverified };
}

export function formatErrors(errors: RowIssue[]): string {
  return [...errors]
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
    .map(
      (e) => `  ${e.file}:${e.line}${e.id ? ` [${e.id}]` : ""}: ${e.message}`,
    )
    .join("\n");
}

/** Markdown report written next to the data after each import. */
export function formatReport(r: ImportResult, date: string): string {
  const published = r.catalog?.models ?? [];
  const lines = [
    `# Raport import date (${date})`,
    "",
    `Publicate: ${published.filter((m) => !m.example).length} modele reale, ${published.filter((m) => m.example).length} exemple.`,
    `Incomplete (nepublicate): ${r.incomplete.length}. Publicate, încă neverificate: ${r.unverified.length}.`,
    "",
    "## Incomplete — câmpuri lipsă",
    "",
    ...(r.incomplete.length
      ? r.incomplete.map(
          (m) => `- \`${m.id}\` (${m.file}:${m.line}): ${m.missing.join(", ")}`,
        )
      : ["- niciunul"]),
    "",
    "## Publicate, dar marcate „needs verification” (afișate ca „în curs de verificare”, neindexate)",
    "",
    ...(r.unverified.length
      ? r.unverified.map((id) => `- \`${id}\``)
      : ["- niciunul"]),
    "",
  ];
  if (r.errors.length)
    lines.push("## Erori", "", "```", formatErrors(r.errors), "```", "");
  return lines.join("\n");
}

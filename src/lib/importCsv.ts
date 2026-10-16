/**
 * CSV (Google Sheets export) → catalog. One row per engine variant; rows of the same model are contiguous
 * and share model-level columns (repeat them or leave them blank on follow-up rows).
 * Runs in Node via type stripping, so runtime imports use explicit .ts extensions.
 */
import { semanticErrors, V1_ENERGIES } from "./dataChecks.ts";
import type { Body, CarModel, Catalog, Engine, Source } from "./types";

export const COLUMNS = [
  "id",
  "brand",
  "model",
  "generation",
  "example",
  "year_from",
  "year_to",
  "years_source",
  "years_date",
  "body",
  "body_source",
  "body_date",
  "seats",
  "seats_source",
  "seats_date",
  "trunk_l",
  "trunk_source",
  "trunk_date",
  "energy",
  "cc",
  "hp",
  "consumption_l100km",
  "engine_source",
  "engine_date",
  "price_min_eur",
  "price_max_eur",
  "price_source",
  "price_date",
] as const;

type Col = (typeof COLUMNS)[number];
type Row = Record<Col, string> & { line: number };
export interface RowError {
  line: number;
  id: string;
  message: string;
}

const ENGINE_COLS: Col[] = [
  "energy",
  "cc",
  "hp",
  "consumption_l100km",
  "engine_source",
  "engine_date",
];
const MODEL_COLS = COLUMNS.filter((c) => !ENGINE_COLS.includes(c));
const BODIES: Body[] = ["hatchback", "sedan", "break", "suv", "mpv"];
/** [source column, date column, fields it covers] */
const SOURCED: [Col, Col, Col[]][] = [
  ["years_source", "years_date", ["year_from", "year_to"]],
  ["body_source", "body_date", ["body"]],
  ["seats_source", "seats_date", ["seats"]],
  ["trunk_source", "trunk_date", ["trunk_l"]],
  [
    "engine_source",
    "engine_date",
    ["energy", "cc", "hp", "consumption_l100km"],
  ],
  ["price_source", "price_date", ["price_min_eur", "price_max_eur"]],
];

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

export function csvToCatalog(
  text: string,
  opts: { updated: string; previous?: Catalog },
): { catalog?: Catalog; errors: RowError[] } {
  const errors: RowError[] = [];
  const table = parseCsv(text);
  if (table.length === 0)
    return { errors: [{ line: 1, id: "", message: "empty file" }] };

  const header = table[0].map((h) => h.trim());
  const missingCols = COLUMNS.filter((c) => !header.includes(c));
  if (missingCols.length)
    return {
      errors: [
        {
          line: 1,
          id: "",
          message: `missing columns: ${missingCols.join(", ")}`,
        },
      ],
    };

  const rows: Row[] = table.slice(1).map((cells, i) => {
    const r = { line: i + 2 } as Row;
    for (const c of COLUMNS) r[c] = (cells[header.indexOf(c)] ?? "").trim();
    return r;
  });

  // Group contiguous rows by id; a non-contiguous repeat is a duplicate id.
  const groups: Row[][] = [];
  const firstLine = new Map<string, number>();
  for (const r of rows) {
    const err = (message: string) =>
      errors.push({ line: r.line, id: r.id, message });
    if (!r.id) {
      err("missing id");
      continue;
    }
    const last = groups.at(-1);
    if (last && last[0].id === r.id) {
      for (const c of MODEL_COLS)
        if (r[c] === "") r[c] = last[0][c];
        else if (r[c] !== last[0][c])
          err(
            `${c} "${r[c]}" conflicts with line ${last[0].line} ("${last[0][c]}")`,
          );
      last.push(r);
    } else if (firstLine.has(r.id)) {
      err(`duplicate id (first used on line ${firstLine.get(r.id)})`);
    } else {
      firstLine.set(r.id, r.line);
      groups.push([r]);
    }
  }

  const previous = new Map(opts.previous?.models.map((m) => [m.id, m]));
  const models: CarModel[] = [];

  for (const group of groups) {
    const head = group[0];
    const before = errors.length;
    const err = (line: number, message: string) =>
      errors.push({ line, id: head.id, message });
    const int = (r: Row, c: Col) => {
      if (r[c] === "") {
        err(r.line, `missing ${c}`);
        return NaN;
      }
      const n = Number(r[c]);
      if (!Number.isInteger(n) || n <= 0)
        err(r.line, `${c} must be a positive whole number, got "${r[c]}"`);
      return n;
    };

    for (const r of group) {
      for (const [srcCol, dateCol, fields] of SOURCED) {
        if (!fields.some((f) => r[f] !== "")) continue;
        if (!r[srcCol])
          err(r.line, `missing ${srcCol} (source for ${fields.join(", ")})`);
        else if (!isUrl(r[srcCol]))
          err(r.line, `${srcCol} is not a valid http(s) URL`);
        if (!r[dateCol]) err(r.line, `missing ${dateCol}`);
        else if (!isDate(r[dateCol]))
          err(r.line, `${dateCol} must be YYYY-MM-DD, got "${r[dateCol]}"`);
      }
    }
    for (const c of ["brand", "model", "generation"] as const)
      if (!head[c]) err(head.line, `missing ${c}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(head.id))
      err(head.line, "id must be lowercase kebab-case");
    if (!(BODIES as string[]).includes(head.body))
      err(head.line, `body must be one of ${BODIES.join("/")}`);
    if (!["", "true", "false"].includes(head.example))
      err(head.line, "example must be true, false or empty");

    const years = { from: int(head, "year_from"), to: int(head, "year_to") };
    if (years.from > years.to)
      err(head.line, `year_from ${years.from} > year_to ${years.to}`);
    const seats = int(head, "seats");
    const trunk = int(head, "trunk_l");
    const price = {
      min: int(head, "price_min_eur"),
      max: int(head, "price_max_eur"),
    };
    if (price.min > price.max)
      err(head.line, `price_min_eur ${price.min} > price_max_eur ${price.max}`);

    const engines: Engine[] = group.map((r) => {
      if (!(V1_ENERGIES as readonly string[]).includes(r.energy))
        err(
          r.line,
          `energy must be one of ${V1_ENERGIES.join("/")}, got "${r.energy}"`,
        );
      const consumption = Number(r.consumption_l100km.replace(",", "."));
      if (!(consumption > 0 && consumption <= 40))
        err(
          r.line,
          `consumption_l100km must be a number in (0, 40], got "${r.consumption_l100km}"`,
        );
      return {
        energy: r.energy as Engine["energy"],
        cc: int(r, "cc"),
        hp: int(r, "hp"),
        consumption: { value: consumption, unit: "l/100km" },
      };
    });

    if (errors.length > before) continue;

    // One source entry per URL, with the most recent access date.
    const sources = new Map<string, Source>();
    for (const r of group)
      for (const [srcCol, dateCol] of SOURCED) {
        const url = r[srcCol];
        if (!url) continue;
        const prev = sources.get(url);
        if (!prev || prev.accessed < r[dateCol])
          sources.set(url, {
            title: new URL(url).hostname,
            url,
            accessed: r[dateCol],
          });
      }

    const old = previous.get(head.id);
    models.push({
      id: head.id,
      ...(head.example === "true" ? { example: true } : {}),
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

  if (errors.length) return { errors };
  const catalog: Catalog = { updated: opts.updated, models };
  for (const message of semanticErrors(catalog))
    errors.push({
      line: firstLine.get(message.split(":")[0]) ?? 0,
      id: message.split(":")[0],
      message,
    });
  return errors.length ? { errors } : { catalog, errors };
}

export function formatErrors(errors: RowError[]): string {
  return errors
    .sort((a, b) => a.line - b.line)
    .map((e) => `  line ${e.line}${e.id ? ` [${e.id}]` : ""}: ${e.message}`)
    .join("\n");
}

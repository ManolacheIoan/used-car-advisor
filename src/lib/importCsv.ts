/**
 * CSV (Google Sheets export) → public catalog. One row per engine variant; rows of the same model are contiguous
 * and share model-level columns (repeat them or leave them blank on follow-up rows).
 *
 * Every spec group has its own source title, URL, retrieval date and license. Prices are entered manually as
 * asking-price ranges with their own source, license and verification. Outcome per model:
 * - invalid value (bad number, URL, date, enum, inverted range, duplicate id, conflict) → error, nothing is written;
 * - missing value, source or license (or license "unknown") → incomplete, not public, listed in the report;
 * - complete but `verification` is not "verified" → not public, listed in the report;
 * - complete and verified → public; its price is kept only if `price_verification` is "verified".
 * Runs in Node via type stripping, so runtime imports use explicit .ts extensions.
 */
import { semanticErrors, V1_ENERGIES } from "./dataChecks.ts";
import type {
  Body,
  CarModel,
  Catalog,
  Engine,
  Price,
  Source,
  TestCycle,
} from "./types";

/** [group, value columns]. Each group has <group>_source_title, _source_url, _date and _license columns. */
const GROUPS = [
  ["years", ["year_from", "year_to"]],
  ["body", ["body"]],
  ["seats", ["seats"]],
  ["trunk", ["trunk_l"]],
  ["engine", ["energy", "cc", "hp", "consumption_l100km", "consumption_cycle"]],
] as const;

const sourceCols = (g: string) =>
  [
    `${g}_source_title`,
    `${g}_source_url`,
    `${g}_date`,
    `${g}_license`,
  ] as const;

/** Manual price entry: asking prices seen in listings, collected by hand, with source and license. All empty = no price. */
export const PRICE_COLS = [
  "price_low_eur",
  "price_high_eur",
  "n_listings",
  "collected_on",
  "kind",
  "notes",
  "price_source_title",
  "price_source_url",
  "price_license",
  "price_verification",
] as const;
export const PRICE_MIN_LISTINGS = 10;
export const PRICE_MAX_AGE_DAYS = 60;
export const PRICE_KIND = "asking_price";
/** License values that do not allow publishing. */
export const UNKNOWN_LICENSES = ["", "unknown", "necunoscut"];

export const COLUMNS = [
  "id",
  "brand",
  "model",
  "generation",
  "verification",
  ...GROUPS.flatMap(([g, cols]) => [...cols, ...sourceCols(g)]),
  ...PRICE_COLS,
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
  /** Present when there are no errors. Contains only complete, verified models (public catalog). */
  catalog?: Catalog;
  errors: RowIssue[];
  incomplete: { id: string; file: string; line: number; missing: string[] }[];
  /** Complete but not verified: kept out of the public catalog. */
  unverified: string[];
  /** Public models without a price: excluded from results, sitemap and scenarios. */
  unpriced?: string[];
  /** Public models whose price exists but is not verified yet (price dropped). */
  priceUnverified?: string[];
  /** For every model in the CSV: fields that have no source yet. */
  unsourced?: { id: string; fields: string[] }[];
}

export const VERIFIED = "verified";
export const NEEDS_VERIFICATION = "needs verification";

const ENGINE_COLS: Col[] = [
  "energy",
  "cc",
  "hp",
  "consumption_l100km",
  "consumption_cycle",
  ...(sourceCols("engine") as unknown as Col[]),
];
const MODEL_COLS = COLUMNS.filter((c) => !ENGINE_COLS.includes(c));
const BODIES: Body[] = ["hatchback", "sedan", "break", "suv", "mpv"];
const CYCLES = ["NEDC", "WLTP", "unknown"] as const;

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
const knownLicense = (s: string) =>
  !UNKNOWN_LICENSES.includes(s.trim().toLowerCase());

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
  const priceUnverified: string[] = [];

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
  const unsourced: NonNullable<ImportResult["unsourced"]> = [];

  for (const group of groups) {
    const head = group[0];
    unsourced.push({ id: head.id, fields: fieldsWithoutSource(group) });
    const errBefore = errors.length;
    const missing: string[] = [];
    const err = (r: Row, message: string) =>
      errors.push({ file: r.file, line: r.line, id: head.id, message });
    const at = (r: Row, c: string, engine = false) =>
      engine && group.length > 1 ? `${c} (line ${r.line})` : c;
    /** Positive whole number, or NaN (recorded as missing / invalid). */
    const int = (r: Row, c: Col) => {
      if (r[c] === "") {
        missing.push(at(r, c, ENGINE_COLS.includes(c)));
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
    if (![VERIFIED, NEEDS_VERIFICATION, ""].includes(head.verification))
      err(
        head,
        `verification must be "${VERIFIED}" or "${NEEDS_VERIFICATION}"`,
      );

    // Sources: a value needs title + URL + date + a known license; format errors are always reported.
    for (const r of group)
      for (const [g, cols] of GROUPS) {
        if (r !== head && g !== "engine") continue;
        const [t, u, d, l] = sourceCols(g) as unknown as Col[];
        if (r[u] && !isUrl(r[u])) err(r, `${u} is not a valid http(s) URL`);
        if (r[d] && !isDate(r[d]))
          err(r, `${d} must be YYYY-MM-DD, got "${r[d]}"`);
        if (!cols.some((c) => r[c] !== "")) continue;
        for (const c of [t, u, d])
          if (!r[c]) missing.push(at(r, c, g === "engine"));
        if (!knownLicense(r[l]))
          missing.push(
            at(
              r,
              `${l}${r[l] ? ` ("${r[l]}" — licență neconfirmată)` : ""}`,
              g === "engine",
            ),
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

    // Price is optional: a model without a price is public but excluded from results, sitemap and scenarios.
    let price: Price | undefined;
    if (PRICE_COLS.some((c) => head[c] !== "")) {
      const low = int(head, "price_low_eur");
      const high = int(head, "price_high_eur");
      const n = int(head, "n_listings");
      if (low > high)
        err(head, `price_low_eur ${low} > price_high_eur ${high}`);
      if (n < PRICE_MIN_LISTINGS)
        err(
          head,
          `n_listings must be at least ${PRICE_MIN_LISTINGS}, got ${n}`,
        );
      if (!head.collected_on) missing.push("collected_on");
      else if (!isDate(head.collected_on))
        err(
          head,
          `collected_on must be YYYY-MM-DD, got "${head.collected_on}"`,
        );
      else {
        const age =
          (Date.parse(opts.updated) - Date.parse(head.collected_on)) /
          86_400_000;
        if (age < 0)
          err(head, `collected_on ${head.collected_on} is in the future`);
        else if (age > PRICE_MAX_AGE_DAYS)
          err(
            head,
            `collected_on ${head.collected_on} is older than ${PRICE_MAX_AGE_DAYS} days; collect prices again`,
          );
      }
      if (!head.kind) missing.push("kind");
      else if (head.kind !== PRICE_KIND)
        err(head, `kind must be "${PRICE_KIND}", got "${head.kind}"`);
      if (!head.price_source_title) missing.push("price_source_title");
      if (!head.price_source_url) missing.push("price_source_url");
      else if (!isUrl(head.price_source_url))
        err(head, "price_source_url is not a valid http(s) URL");
      if (!knownLicense(head.price_license)) missing.push("price_license");
      if (![VERIFIED, NEEDS_VERIFICATION].includes(head.price_verification))
        err(
          head,
          `price_verification must be "${VERIFIED}" or "${NEEDS_VERIFICATION}"`,
        );
      price = {
        low,
        high,
        n_listings: n,
        collected_on: head.collected_on,
        kind: PRICE_KIND,
        ...(head.notes ? { notes: head.notes } : {}),
        source_title: head.price_source_title,
        source_url: head.price_source_url,
        retrieved_on: head.collected_on,
        license: head.price_license,
        verified: head.price_verification === VERIFIED,
        is_demo: false,
      };
    }

    const engines: Engine[] = group.map((r) => {
      if (!r.energy) missing.push(at(r, "energy", true));
      else if (!(V1_ENERGIES as readonly string[]).includes(r.energy))
        err(
          r,
          `energy must be one of ${V1_ENERGIES.join("/")}, got "${r.energy}"`,
        );
      let consumption = NaN;
      if (!r.consumption_l100km)
        missing.push(at(r, "consumption_l100km", true));
      else {
        consumption = Number(r.consumption_l100km.replace(",", "."));
        if (!(consumption > 0 && consumption <= 40))
          err(
            r,
            `consumption_l100km must be a number in (0, 40], got "${r.consumption_l100km}"`,
          );
      }
      if (!r.consumption_cycle) missing.push(at(r, "consumption_cycle", true));
      else if (!(CYCLES as readonly string[]).includes(r.consumption_cycle))
        err(
          r,
          `consumption_cycle must be one of ${CYCLES.join("/")}, got "${r.consumption_cycle}"`,
        );
      return {
        energy: r.energy as Engine["energy"],
        cc: int(r, "cc"),
        hp: int(r, "hp"),
        consumption: {
          value: consumption,
          unit: "l/100km",
          cycle: r.consumption_cycle as TestCycle,
        },
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
    if (head.verification !== VERIFIED) {
      unverified.push(head.id);
      continue;
    }
    if (price && !price.verified) {
      priceUnverified.push(head.id);
      price = undefined;
    }

    // One source entry per URL, with the most recent retrieval date.
    const sources = new Map<string, Source>();
    for (const r of group)
      for (const [g] of GROUPS) {
        const [t, u, d, l] = sourceCols(g) as unknown as Col[];
        if (!r[u]) continue;
        const prev = sources.get(r[u]);
        if (!prev || prev.retrieved_on < r[d])
          sources.set(r[u], {
            source_title: r[t],
            source_url: r[u],
            retrieved_on: r[d],
            license: r[l],
          });
      }

    const old = previous.get(head.id);
    models.push({
      id: head.id,
      verified: true,
      is_demo: false,
      brand: head.brand,
      model: head.model,
      generation: head.generation,
      years,
      body: head.body as Body,
      engines,
      seats,
      trunk_l: trunk,
      ...(price ? { price_eur: price } : {}),
      sources: [...sources.values()],
      // V2 fields are not in the CSV; keep what already exists.
      pros: old?.pros ?? [],
      cons: old?.cons ?? [],
      known_issues: old?.known_issues ?? [],
    });
  }

  const base = { errors, incomplete, unverified, unsourced };
  if (errors.length) return base;
  const unpriced = models.filter((m) => !m.price_eur).map((m) => m.id);
  const catalog: Catalog = { updated: opts.updated, models };
  for (const message of semanticErrors(catalog)) {
    const id = message.split(":")[0];
    const r = first.get(id);
    errors.push({ file: r?.file ?? "", line: r?.line ?? 0, id, message });
  }
  return errors.length ? base : { ...base, catalog, unpriced, priceUnverified };
}

/**
 * Fields of a model that have no source. Identity fields (brand, model, generation) have no source column;
 * a spec group counts as unsourced if its value, its source title/URL/date or a known license is missing;
 * the price counts as unsourced until the manual price entry is complete.
 */
export function fieldsWithoutSource(group: Row[]): string[] {
  const head = group[0];
  const out = ["brand, model, generation (fără coloană de sursă)"];
  for (const [g, cols] of GROUPS) {
    const rows = g === "engine" ? group : [head];
    for (const r of rows) {
      const [t, u, d, l] = sourceCols(g) as unknown as Col[];
      const where =
        g === "engine" && group.length > 1 ? ` (linia ${r.line})` : "";
      if (cols.some((c) => r[c] === "") || !r[t] || !r[u] || !r[d])
        out.push(`${cols.join(", ")}${where}`);
      else if (!knownLicense(r[l]))
        out.push(`${cols.join(", ")}${where}: licență neconfirmată`);
    }
  }
  const price: Col[] = [
    "price_low_eur",
    "price_high_eur",
    "n_listings",
    "collected_on",
    "kind",
    "price_source_url",
    "price_license",
  ];
  if (price.some((c) => head[c] === "") || !knownLicense(head.price_license))
    out.push(
      "preț (price_low_eur, price_high_eur, n_listings, collected_on, kind, sursă, licență)",
    );
  return out;
}

export function formatErrors(errors: RowIssue[]): string {
  return [...errors]
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
    .map(
      (e) => `  ${e.file}:${e.line}${e.id ? ` [${e.id}]` : ""}: ${e.message}`,
    )
    .join("\n");
}

const list = (xs: string[] | undefined) =>
  xs?.length ? xs.map((id) => `- \`${id}\``) : ["- niciunul"];

/** Markdown report written next to the data after each import. */
export function formatReport(r: ImportResult, date: string): string {
  const published = r.catalog?.models ?? [];
  const lines = [
    `# Raport import date (${date})`,
    "",
    `Catalog public: ${published.length} modele. Incomplete: ${r.incomplete.length}. Neverificate: ${r.unverified.length}. Fără preț verificat: ${r.unpriced?.length ?? 0}.`,
    "",
    "## Incomplete — câmpuri, surse sau licențe lipsă (nu intră în catalogul public)",
    "",
    ...(r.incomplete.length
      ? r.incomplete.map(
          (m) => `- \`${m.id}\` (${m.file}:${m.line}): ${m.missing.join(", ")}`,
        )
      : ["- niciunul"]),
    "",
    "## Complete, dar neverificate (nu intră în catalogul public)",
    "",
    ...list(r.unverified),
    "",
    "## Publice fără preț verificat — excluse din rezultate, sitemap și scenarii",
    "",
    ...list(r.unpriced),
    "",
    "## Preț introdus, dar neverificat (prețul nu a fost publicat)",
    "",
    ...list(r.priceUnverified),
    "",
    "## Câmpuri fără sursă, pe model",
    "",
    "Nimic nu a fost completat din memorie. Câmpurile de mai jos nu au încă o valoare cu sursă (titlu, URL, dată, licență).",
    "",
    ...(r.unsourced ?? []).map((m) => `- \`${m.id}\`: ${m.fields.join("; ")}`),
    "",
  ];
  if (r.errors.length)
    lines.push("## Erori", "", "```", formatErrors(r.errors), "```", "");
  return lines.join("\n");
}

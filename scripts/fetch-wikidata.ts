/**
 * Usage: npm run fetch:wikidata
 * Builds the DEMO identity list (brand, model, generation, production years, body type) from Wikidata (CC0)
 * through the public MediaWiki API (no SPARQL), following the Wikimedia API etiquette:
 * descriptive User-Agent, ≤ 1 request per second, batched entity reads (50 ids per call).
 *
 * Steps (every call is logged in data/wikidata/fetch-log.json with its URL and date):
 *  1. for each brand in BRANDS: full-text search `haswbstatement:P31=Q3231690 haswbstatement:P1716|P176=<brand>`
 *     (car models of that brand or manufacturer);
 *  2. read the entities (labels en/ro, P31, P279, P179, P1716, P176, P580 start time, P582 end time);
 *  3. keep car models whose English label starts with one of MODEL_LINES (editorial list of model lines common
 *     in Romania — a selection, not data) and that have a start year ≥ 2000;
 *  4. body type: only from P279 values whose English label names a body style (see BODY_KEYWORDS); otherwise empty.
 * Nothing is filled from memory: missing years or body type stay empty and are listed in data/wikidata/report.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const API = "https://www.wikidata.org/w/api.php";
const UA =
  "AlegeMasina/1.0 (portfolio project; https://github.com/ManolacheIoan/used-car-advisor; contact@manotek.ro)";
const RETRIEVED_ON = new Date().toISOString().slice(0, 10);
const CAR_MODEL = "Q3231690";
const MIN_START_YEAR = 2000;

/** Brands common in Romania (editorial selection). */
const BRANDS = [
  "Dacia",
  "Volkswagen",
  "Škoda",
  "Renault",
  "Ford",
  "Opel",
  "BMW",
  "Audi",
  "Mercedes-Benz",
  "Toyota",
  "Hyundai",
  "Kia",
  "Peugeot",
  "Citroën",
  "Nissan",
  "Fiat",
  "Suzuki",
  "SEAT",
  "Honda",
  "Mazda",
  "Volvo",
];

/** Model lines to keep (label prefix after the brand). Editorial selection, not data. */
const MODEL_LINES: Record<string, string[]> = {
  Dacia: ["Logan", "Sandero", "Duster", "Lodgy", "Jogger", "Dokker"],
  Volkswagen: [
    "Golf",
    "Passat",
    "Polo",
    "Tiguan",
    "Touran",
    "T-Roc",
    "Jetta",
    "Sharan",
  ],
  Škoda: [
    "Octavia",
    "Fabia",
    "Superb",
    "Rapid",
    "Kodiaq",
    "Karoq",
    "Scala",
    "Kamiq",
    "Yeti",
  ],
  Renault: [
    "Clio",
    "Mégane",
    "Megane",
    "Captur",
    "Kadjar",
    "Scénic",
    "Scenic",
    "Talisman",
    "Laguna",
    "Symbol",
  ],
  Ford: ["Focus", "Fiesta", "Mondeo", "Kuga", "C-Max", "EcoSport", "Puma"],
  Opel: [
    "Astra",
    "Corsa",
    "Insignia",
    "Mokka",
    "Zafira",
    "Meriva",
    "Grandland",
    "Crossland",
  ],
  BMW: ["3 Series", "5 Series", "1 Series", "X1", "X3", "X5"],
  Audi: ["A4", "A6", "A3", "Q3", "Q5", "Q7"],
  "Mercedes-Benz": ["C-Class", "E-Class", "A-Class", "GLC", "B-Class"],
  Toyota: ["Corolla", "Auris", "Yaris", "RAV4", "Avensis", "C-HR"],
  Hyundai: ["i30", "Tucson", "i20", "ix35", "Santa Fe", "Kona", "i10"],
  Kia: ["Ceed", "cee'd", "Sportage", "Rio", "Sorento", "Niro", "Picanto"],
  Peugeot: ["308", "208", "3008", "508", "2008", "207", "307", "5008"],
  Citroën: ["C3", "C4", "C5", "Berlingo", "C-Elysée"],
  Nissan: ["Qashqai", "Juke", "X-Trail", "Micra", "Note"],
  Fiat: ["500", "Tipo", "Punto", "Panda", "Doblò"],
  Suzuki: ["Vitara", "SX4", "Swift", "Ignis", "S-Cross"],
  SEAT: ["Leon", "Ibiza", "Ateca", "Toledo", "Arona"],
  Honda: ["Civic", "CR-V", "Jazz", "Accord", "HR-V"],
  Mazda: ["CX-5", "Mazda3", "Mazda6", "CX-3", "Mazda2"],
  Volvo: ["XC60", "XC90", "V40", "S60", "V60", "XC40"],
};

/** English label keywords of P279 values that name a body style. */
const BODY_KEYWORDS: [
  RegExp,
  "hatchback" | "sedan" | "break" | "suv" | "mpv",
][] = [
  [/hatchback|liftback/i, "hatchback"],
  [/sedan|saloon/i, "sedan"],
  [/station wagon|estate car|\bwagon\b/i, "break"],
  [/sport utility|\bSUV\b|crossover/i, "suv"],
  [/minivan|multi-purpose vehicle|\bMPV\b|people carrier/i, "mpv"],
];

const log: { url: string; retrieved_on: string }[] = [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api(params: Record<string, string>) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  await sleep(1100); // ≤ 1 request per second
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Api-User-Agent": UA },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  log.push({ url, retrieved_on: RETRIEVED_ON });
  return res.json();
}

type Claim = {
  mainsnak: { datavalue?: { value: { id?: string; time?: string } } };
};
type Entity = {
  id: string;
  labels: Record<string, { value: string }>;
  claims: Record<string, Claim[]>;
};

const ids = (e: Entity, p: string) =>
  (e.claims[p] ?? [])
    .map((c) => c.mainsnak.datavalue?.value.id)
    .filter(Boolean) as string[];
const years = (e: Entity, p: string) =>
  (e.claims[p] ?? [])
    .map((c) => c.mainsnak.datavalue?.value.time?.match(/^\+(\d{4})/)?.[1])
    .filter(Boolean)
    .map(Number);

async function entities(qids: string[]): Promise<Entity[]> {
  const out: Entity[] = [];
  for (let i = 0; i < qids.length; i += 50) {
    const r = await api({
      action: "wbgetentities",
      ids: qids.slice(i, i + 50).join("|"),
      props: "labels|claims",
      languages: "en|ro",
    });
    out.push(...(Object.values(r.entities) as Entity[]));
  }
  return out;
}

async function search(query: string): Promise<string[]> {
  const r = await api({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: "500",
    srnamespace: "0",
  });
  return r.query.search.map((x: { title: string }) => x.title);
}

async function main() {
  // Brand items
  const brandQ: Record<string, string> = {};
  for (const b of BRANDS) {
    const r = await api({
      action: "wbsearchentities",
      search: b,
      language: "en",
      type: "item",
      limit: "5",
    });
    const hit = r.search.find((x: { label?: string; description?: string }) =>
      /automo|car|vehicle|brand|manufacturer/i.test(x.description ?? ""),
    );
    if (hit) brandQ[b] = hit.id;
  }

  // Car models per brand (as brand P1716 or manufacturer P176)
  const found = new Map<string, string>();
  for (const [b, q] of Object.entries(brandQ))
    for (const p of ["P1716", "P176"])
      for (const id of await search(
        `haswbstatement:P31=${CAR_MODEL} haswbstatement:${p}=${q}`,
      ))
        found.set(id, b);

  const ents = await entities([...found.keys()]);
  // Labels of all P279 targets (to recognise body styles)
  const p279 = [...new Set(ents.flatMap((e) => ids(e, "P279")))];
  const p279Labels = Object.fromEntries(
    (await entities(p279)).map((e) => [e.id, e.labels.en?.value ?? ""]),
  );

  const rows: Record<string, unknown>[] = [];
  const missing: { id: string; label: string; missing: string[] }[] = [];
  for (const e of ents) {
    const brand = found.get(e.id)!;
    const label = e.labels.en?.value ?? "";
    const rest = label.startsWith(brand + " ")
      ? label.slice(brand.length + 1)
      : "";
    const line = (MODEL_LINES[brand] ?? []).find(
      (l) => rest === l || rest.startsWith(l + " "),
    );
    if (!line) continue;
    const from = Math.min(...years(e, "P580"));
    const to = Math.max(...years(e, "P582"));
    if (Number.isFinite(from) && from < MIN_START_YEAR) continue;
    const bodies = [
      ...new Set(
        ids(e, "P279").flatMap((q) =>
          BODY_KEYWORDS.filter(([re]) => re.test(p279Labels[q] ?? "")).map(
            ([, b]) => b,
          ),
        ),
      ),
    ];
    const generation = rest.slice(line.length).trim();
    const gaps = [
      ...(Number.isFinite(from) ? [] : ["year_from (P580)"]),
      ...(Number.isFinite(to) ? [] : ["year_to (P582)"]),
      ...(bodies.length === 1
        ? []
        : [
            bodies.length
              ? `body (ambiguous: ${bodies.join("/")})`
              : "body (P279)",
          ]),
      ...(generation ? [] : ["generation (label has no generation)"]),
    ];
    rows.push({
      qid: e.id,
      label,
      label_ro: e.labels.ro?.value ?? null,
      brand,
      model: line,
      generation: generation || null,
      year_from: Number.isFinite(from) ? from : null,
      year_to: Number.isFinite(to) ? to : null,
      body: bodies.length === 1 ? bodies[0] : null,
      p279: ids(e, "P279").map((q) => `${q} ${p279Labels[q] ?? ""}`.trim()),
    });
    if (gaps.length) missing.push({ id: e.id, label, missing: gaps });
  }
  rows.sort((a, b) => String(a.label).localeCompare(String(b.label)));

  mkdirSync("data/wikidata", { recursive: true });
  writeFileSync(
    "data/wikidata/models.json",
    JSON.stringify(
      {
        retrieved_on: RETRIEVED_ON,
        license: "CC0 1.0",
        source: "https://www.wikidata.org",
        brands: brandQ,
        rows,
      },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(
    "data/wikidata/fetch-log.json",
    JSON.stringify(log, null, 2) + "\n",
  );
  writeFileSync(
    "data/wikidata/missing.json",
    JSON.stringify(missing, null, 2) + "\n",
  );
  console.log(
    `✓ ${rows.length} car models kept (${missing.length} with gaps), ${log.length} API calls`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

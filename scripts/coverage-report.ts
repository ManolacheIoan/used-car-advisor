/**
 * Usage: npm run report:coverage
 * Per-model data coverage from data/cars.template.csv → data/coverage-report.md:
 * which field groups have a source (and a confirmed licence), which are missing, price present or absent.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseCsv, UNKNOWN_LICENSES } from "../src/lib/importCsv.ts";

const GROUPS = [
  ["years", "Ani", ["year_from", "year_to"]],
  ["body", "Caroserie", ["body"]],
  ["seats", "Locuri", ["seats"]],
  ["trunk", "Portbagaj", ["trunk_l"]],
] as const;

const t = parseCsv(readFileSync("data/cars.template.csv", "utf8"));
const h = t[0];
const rows = t
  .slice(1)
  .map((c) => Object.fromEntries(h.map((k, i) => [k, (c[i] ?? "").trim()])));
const byId = new Map<string, Record<string, string>[]>();
for (const r of rows) byId.set(r.id, [...(byId.get(r.id) ?? []), r]);

const mark = (
  r: Record<string, string>,
  g: string,
  cols: readonly string[],
) => {
  if (cols.some((c) => !r[c])) return "✗ lipsă";
  if (!r[`${g}_source_url`] || !r[`${g}_date`]) return "✗ fără sursă";
  return UNKNOWN_LICENSES.includes(r[`${g}_license`].toLowerCase())
    ? "⚠ licență"
    : "✓";
};

const lines = [
  `# Acoperire date pe model (${new Date().toISOString().slice(0, 10)})`,
  "",
  "✓ = valoare cu sursă și licență confirmată · ⚠ licență = sursă fără licență confirmată · ✗ = lipsă",
  "",
  `| Model | ${GROUPS.map((g) => g[1]).join(" | ")} | Motorizări (cu sursă și licență) | Preț | Verificat |`,
  `|---|${GROUPS.map(() => "---").join("|")}|---|---|---|`,
];
let ready = 0;
for (const [id, group] of byId) {
  const head = group[0];
  const engines = group.filter(
    (r) =>
      mark(r, "engine", [
        "energy",
        "cc",
        "hp",
        "consumption_l100km",
        "consumption_cycle",
      ]) === "✓",
  ).length;
  const price =
    head.price_low_eur && head.price_high_eur
      ? head.price_verification === "verified"
        ? "✓"
        : "⚠ neverificat"
      : "✗ lipsă";
  const cells = GROUPS.map(([g, , cols]) => mark(head, g, cols));
  const verified = head.verification === "verified" ? "✓" : "✗";
  if (
    [...cells, price, verified].every((c) => c === "✓") &&
    engines === group.length
  )
    ready++;
  lines.push(
    `| ${head.brand} ${head.model} ${head.generation} (\`${id}\`) | ${cells.join(" | ")} | ${engines}/${group.length} | ${price} | ${verified} |`,
  );
}
lines.push(
  "",
  `Gata pentru modul public: ${ready} din ${byId.size} modele.`,
  "",
);
writeFileSync("data/coverage-report.md", lines.join("\n"));
console.log(
  `✓ data/coverage-report.md: ${byId.size} models, ${ready} ready for public mode`,
);

/**
 * Usage: npm run import:cars [-- file.csv ...]
 * Default input: data/cars.template.csv.
 * Writes src/data/cars.public.json (complete, verified, licensed models only) plus data/import-report.md.
 * Writes nothing if any row has an invalid value.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
  csvToCatalog,
  formatErrors,
  formatReport,
} from "../src/lib/importCsv.ts";

const inputs = process.argv.slice(2);
const paths = inputs.length ? inputs : ["data/cars.template.csv"];
const OUT = "src/data/cars.public.json";
const REPORT = "data/import-report.md";
const today = new Date().toISOString().slice(0, 10);

const previous = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, "utf8"))
  : undefined;
const result = csvToCatalog(
  paths.map((p) => ({ name: p, text: readFileSync(p, "utf8") })),
  { updated: today, previous },
);
writeFileSync(REPORT, formatReport(result, today));

if (!result.catalog) {
  console.error(
    `✗ ${result.errors.length} error(s), nothing written:\n${formatErrors(result.errors)}`,
  );
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
if (
  !ajv.validate(
    JSON.parse(readFileSync("src/data/cars.schema.json", "utf8")),
    result.catalog,
  )
) {
  console.error(
    `✗ schema validation failed:\n  ${ajv.errorsText(ajv.errors, { separator: "\n  " })}`,
  );
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify(result.catalog, null, 2) + "\n");
console.log(
  `✓ ${OUT}: ${result.catalog.models.length} public models.` +
    ` ${result.incomplete.length} incomplete, ${result.unverified.length} unverified, ${result.unpriced?.length ?? 0} without price. See ${REPORT}.`,
);

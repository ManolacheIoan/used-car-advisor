/**
 * Usage: npm run import:cars [-- file.csv ...]
 * Default input: data/cars.template.csv. Pass more files (e.g. data/examples.csv) to import them too.
 * Writes src/data/cars.json with complete models only, plus data/import-report.md.
 * Writes nothing if any row has an invalid value.
 */
import { readFileSync, writeFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
  csvToCatalog,
  formatErrors,
  formatReport,
} from "../src/lib/importCsv.ts";

const inputs = process.argv.slice(2);
const paths = inputs.length ? inputs : ["data/cars.template.csv"];
const OUT = "src/data/cars.json";
const REPORT = "data/import-report.md";
const today = new Date().toISOString().slice(0, 10);

const previous = JSON.parse(readFileSync(OUT, "utf8"));
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
const real = result.catalog.models.filter((m) => !m.example).length;
console.log(
  `✓ ${OUT}: ${real} real + ${result.catalog.models.length - real} example models published.` +
    ` ${result.incomplete.length} incomplete (skipped), ${result.unverified.length} published as awaiting verification. See ${REPORT}.`,
);

/**
 * Usage: npm run import:cars -- path/to/export.csv
 * Converts the Google Sheets CSV to src/data/cars.json. Writes nothing if any row has an error.
 */
import { readFileSync, writeFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { csvToCatalog, formatErrors } from "../src/lib/importCsv.ts";

const [csvPath] = process.argv.slice(2);
if (!csvPath) {
  console.error("Usage: npm run import:cars -- path/to/export.csv");
  process.exit(2);
}

const OUT = "src/data/cars.json";
const previous = JSON.parse(readFileSync(OUT, "utf8"));
const today = new Date().toISOString().slice(0, 10);
const { catalog, errors } = csvToCatalog(readFileSync(csvPath, "utf8"), {
  updated: today,
  previous,
});

if (!catalog) {
  console.error(
    `✗ ${errors.length} error(s) in ${csvPath}:\n${formatErrors(errors)}`,
  );
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
if (
  !ajv.validate(
    JSON.parse(readFileSync("src/data/cars.schema.json", "utf8")),
    catalog,
  )
) {
  console.error(
    `✗ schema validation failed:\n  ${ajv.errorsText(ajv.errors, { separator: "\n  " })}`,
  );
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");
console.log(
  `✓ ${catalog.models.length} models written to ${OUT} (updated ${today})`,
);

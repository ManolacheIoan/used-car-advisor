/**
 * Usage: npm run build:demo-data
 * Reads data/demo-models.json (identity + source) and writes src/data/cars.demo.json with synthetic specs and
 * prices (deterministic formula, fixed seed; see docs/DEMO_DATA.md). For local testing only, never published.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { buildDemoCatalog, type DemoIdentity } from "../src/lib/demoData.ts";

const input = JSON.parse(readFileSync("data/demo-models.json", "utf8")) as {
  generated_on: string;
  models: DemoIdentity[];
};
const catalog = buildDemoCatalog(input.models, input.generated_on);
writeFileSync(
  "src/data/cars.demo.json",
  JSON.stringify(catalog, null, 2) + "\n",
);
console.log(
  `✓ src/data/cars.demo.json: ${catalog.models.length} DEMO models (synthetic values)`,
);

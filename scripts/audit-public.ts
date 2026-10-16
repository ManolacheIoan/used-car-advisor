/**
 * Usage: npm run build && npm run audit:public
 * Fails (exit 1) if the PUBLIC build or data contains anything that must not be published.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  auditBrandFiles,
  auditCatalog,
  auditDrafts,
  auditText,
} from "../src/lib/audit.ts";
import { allGuides } from "../src/lib/guides.ts";

const OUT = "out";
const today = new Date().toISOString().slice(0, 10);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(OUT);
const text = Object.fromEntries(
  files
    .filter((f) => /\.(html|txt|json|xml|js|css|webmanifest)$/.test(f))
    .map((f) => [relative(OUT, f), readFileSync(f, "utf8")]),
);
const findings = [
  ...auditCatalog(
    JSON.parse(readFileSync("src/data/cars.public.json", "utf8")),
    today,
  ),
  ...auditBrandFiles(readdirSync("public/brands")),
  ...auditText(text),
  ...auditDrafts(
    allGuides()
      .filter((g) => g.status === "draft")
      .map((g) => g.slug),
    files.map((f) => relative(OUT, f)),
  ),
];
if (!readFileSync(join(OUT, "index.html"), "utf8").includes("<html"))
  findings.push("out/index.html missing: run the public build first");

if (findings.length) {
  console.error(
    `✗ audit:public — ${findings.length} problem(s):\n  ${findings.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(
  `✓ audit:public — ${files.length} files checked, nothing demo, draft, unverified or unlicensed`,
);

/**
 * Lists official brand files the owner added to public/brands/ (<brand-id>.svg or .png) into
 * src/data/brandAssets.json. A file is used ONLY if a licence file sits next to it: <brand-id>.LICENSE.txt
 * (terms / permission for that logo). Runs before dev and build; nothing is downloaded or generated.
 */
import { readdirSync, writeFileSync } from "node:fs";

export function scanBrandFiles(files: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  // .svg before .png for the same brand
  const key = (f: string) => f.replace(/\.svg$/, ".0").replace(/\.png$/, ".1");
  for (const f of [...files].sort((a, b) => key(a).localeCompare(key(b)))) {
    const m = f.match(/^([a-z0-9-]+)\.(svg|png)$/);
    if (m && !out[m[1]] && files.includes(`${m[1]}.LICENSE.txt`))
      out[m[1]] = `/brands/${f}`;
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const map = scanBrandFiles(readdirSync("public/brands"));
  writeFileSync(
    "src/data/brandAssets.json",
    JSON.stringify(map, null, 2) + "\n",
  );
  console.log(`brand assets: ${Object.keys(map).length} file(s)`);
}

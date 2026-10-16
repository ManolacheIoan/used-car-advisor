/**
 * Usage: npm run check:links [-- --strict]
 * Checks every external source and official URL (CSV sources, public catalog, demo identities, guides, official
 * links, config sources). Respects robots.txt (disallowed URLs are reported as "not checked"), ≤ 1 request per
 * second, descriptive User-Agent, HEAD with GET fallback. Writes data/link-report.md.
 * --strict exits 1 if any URL used by the public build is broken (run before hosting; not in CI, network-dependent).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseCsv } from "../src/lib/importCsv.ts";
import { robotsMatch } from "../src/lib/robots.ts";

const UA = "AlegeMasina-linkcheck/1.0 (portfolio project; contact@manotek.ro)";
const strict = process.argv.includes("--strict");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const urls = new Map<string, { origin: string; publicUse: boolean }>();
const add = (u: string, origin: string, publicUse: boolean) => {
  if (!/^https?:\/\//.test(u)) return;
  const prev = urls.get(u);
  urls.set(u, {
    origin: prev ? `${prev.origin}, ${origin}` : origin,
    publicUse: (prev?.publicUse ?? false) || publicUse,
  });
};

// Sources (CSV feeds the public catalog once verified)
const t = parseCsv(readFileSync("data/cars.template.csv", "utf8"));
for (const r of t.slice(1))
  for (let i = 0; i < t[0].length; i++)
    if (t[0][i].endsWith("_source_url") && r[i]) add(r[i], "CSV", true);
for (const m of JSON.parse(readFileSync("src/data/cars.public.json", "utf8"))
  .models)
  for (const s of m.sources) add(s.source_url, "catalog public", true);
for (const m of JSON.parse(readFileSync("data/demo-models.json", "utf8"))
  .models)
  add(m.source.source_url, "demo", false);
// Guides
for (const f of readdirSync("content/ghiduri"))
  for (const [, u] of readFileSync(`content/ghiduri/${f}`, "utf8").matchAll(
    /\]\((https?:\/\/[^)\s]+)\)/g,
  ))
    add(u, `ghid ${f}`, true);
// Official links and config sources (plain text scan of the config files)
for (const f of [
  "src/config/officialLinks.ts",
  "src/config/fuelPrices.ts",
  "src/config/exchangeRate.ts",
])
  for (const [u] of readFileSync(f, "utf8").matchAll(/https?:\/\/[^"'\s)]+/g))
    add(u, f, true);

const robots = new Map<string, string[]>();
async function disallowed(u: URL): Promise<boolean> {
  if (!robots.has(u.origin)) {
    let rules: string[] = [];
    try {
      const res = await fetch(`${u.origin}/robots.txt`, {
        headers: { "User-Agent": UA },
      });
      if (res.ok) {
        let applies = false;
        for (const line of (await res.text()).split("\n")) {
          const [k, ...v] = line.split(":");
          const key = k.trim().toLowerCase();
          const val = v.join(":").trim();
          if (key === "user-agent") applies = val === "*";
          else if (applies && key === "disallow" && val) rules.push(val);
        }
      }
    } catch {
      rules = [];
    }
    robots.set(u.origin, rules);
    await sleep(1000);
  }
  const path = u.pathname + u.search;
  return robots.get(u.origin)!.some((r) => robotsMatch(r, path));
}

async function check(u: string): Promise<string> {
  const url = new URL(u);
  if (await disallowed(url)) return "nu verificat (robots.txt)";
  for (const method of ["HEAD", "GET"]) {
    try {
      await sleep(1000);
      const res = await fetch(u, {
        method,
        redirect: "follow",
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) return `ok ${res.status}`;
      if (method === "GET") return `eroare ${res.status}`;
    } catch (e) {
      if (method === "GET") return `eroare ${(e as Error).name}`;
    }
  }
  return "eroare";
}

const results: {
  url: string;
  status: string;
  origin: string;
  publicUse: boolean;
}[] = [];
for (const [url, info] of urls)
  results.push({ url, status: await check(url), ...info });
const broken = results.filter((r) => r.status.startsWith("eroare"));
const date = new Date().toISOString().slice(0, 10);
writeFileSync(
  "data/link-report.md",
  [
    `# Verificare linkuri (${date})`,
    "",
    `${results.length} URL-uri · ${broken.length} cu erori · ${results.filter((r) => r.status.startsWith("nu verificat")).length} neverificate (robots.txt)`,
    "",
    "| Status | URL | Folosit în | Public |",
    "|---|---|---|---|",
    ...results
      .sort((a, b) => a.status.localeCompare(b.status))
      .map(
        (r) =>
          `| ${r.status} | ${r.url} | ${r.origin.slice(0, 60)} | ${r.publicUse ? "da" : "nu"} |`,
      ),
    "",
  ].join("\n"),
);
console.log(
  `✓ data/link-report.md: ${results.length} URLs, ${broken.length} broken`,
);
if (strict && broken.some((r) => r.publicUse)) process.exit(1);

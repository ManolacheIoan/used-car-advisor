/**
 * Usage: npm run build:demo-identities   (after npm run fetch:wikidata)
 * Completes the Wikidata identity rows (data/wikidata/models.json, CC0) with production years and body style from
 * the English Wikipedia article linked to the same Wikidata item (infobox fields `production` and `body_style`,
 * CC BY-SA 4.0, pinned revision). Public MediaWiki API, descriptive User-Agent, ≤ 1 request per second.
 * Writes data/demo-models.json (≤ MAX_ROWS rows with complete identity) and data/wikidata/coverage.json.
 * Rules (no guessing): years = first and last 4-digit year in `production`; "present" → year_to = retrieval year
 * (noted); body = first body-style keyword in `body_style` (else Wikidata P279 body style, else excluded).
 * The infobox is used only when the article is specific to the generation (its title is not just "<brand> <model>").
 * Electric and hybrid models are excluded (not in V1). Extracted infobox fields are cached in data/wikidata/infobox.json.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Body } from "../src/lib/types";

const UA =
  "AlegeMasina/1.0 (portfolio project; https://github.com/ManolacheIoan/used-car-advisor; contact@manotek.ro)";
const RETRIEVED_ON = new Date().toISOString().slice(0, 10);
const MAX_ROWS = 80;
const MAX_PER_LINE = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(base: string, params: Record<string, string>) {
  const url = `${base}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  await sleep(1100);
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Api-User-Agent": UA },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const BODY_WORDS: [RegExp, Body][] = [
  [/hatchback|liftback/i, "hatchback"],
  [/sedan|saloon/i, "sedan"],
  [/estate|station wagon|\bwagon\b|\btourer\b/i, "break"],
  [/\bSUV\b|sport utility|crossover/i, "suv"],
  [/\bMPV\b|minivan|people carrier|multi-purpose/i, "mpv"],
];

function clean(v: string) {
  return v
    .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/<br\s*\/?>/g, "; ")
    .replace(/\{\{|\}\}|\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function field(wikitext: string, name: string): string | null {
  const m = wikitext.match(
    new RegExp(
      `\\n\\s*\\|\\s*${name}\\s*=([\\s\\S]*?)(?=\\n\\s*\\|\\s*[a-z_0-9]+\\s*=|\\n\\}\\})`,
      "i",
    ),
  );
  return m ? clean(m[1]) : null;
}

function firstBody(text: string | null): Body | null {
  if (!text) return null;
  let best: [number, Body] | null = null;
  for (const [re, b] of BODY_WORDS) {
    const i = text.search(re);
    if (i >= 0 && (!best || i < best[0])) best = [i, b];
  }
  return best ? best[1] : null;
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

type Row = {
  qid: string;
  label: string;
  brand: string;
  model: string;
  generation: string | null;
  year_from: number | null;
  year_to: number | null;
  body: Body | null;
};

async function main() {
  const wd = JSON.parse(readFileSync("data/wikidata/models.json", "utf8")) as {
    rows: Row[];
    retrieved_on: string;
  };
  const rows = wd.rows.filter((r) => r.generation);

  // Sitelinks to English Wikipedia
  const enwiki: Record<string, string> = {};
  for (let i = 0; i < rows.length; i += 50) {
    const r = await get("https://www.wikidata.org/w/api.php", {
      action: "wbgetentities",
      ids: rows
        .slice(i, i + 50)
        .map((x) => x.qid)
        .join("|"),
      props: "sitelinks",
      sitefilter: "enwiki",
    });
    for (const [q, e] of Object.entries(
      r.entities as Record<
        string,
        { sitelinks?: { enwiki?: { title: string } } }
      >,
    ))
      if (e.sitelinks?.enwiki) enwiki[q] = e.sitelinks.enwiki.title;
  }

  const CACHE = "data/wikidata/infobox.json";
  const cache: Record<
    string,
    {
      title: string;
      revid: number;
      production: string | null;
      body_style: string | null;
    }
  > = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
  const norm = (s: string) => slug(s.replace(/\s*\(.*\)$/, ""));
  const coverage: Record<string, unknown>[] = [];
  const complete: Record<string, unknown>[] = [];
  for (const r of rows) {
    const cov: Record<string, unknown> = {
      qid: r.qid,
      label: r.label,
      wikidata_years: r.year_from !== null,
      wikidata_body: r.body,
    };
    let years =
      r.year_from !== null && r.year_to !== null
        ? { from: r.year_from, to: r.year_to }
        : null;
    let body = r.body;
    let wp: {
      title: string;
      revid: number;
      production: string | null;
      body_style: string | null;
    } | null = null;
    if (/\b(e-tron|EV|electric|hybrid|PHEV|e-[A-Z])\b/i.test(r.label)) {
      coverage.push({ ...cov, excluded: "electric/hybrid (not in V1)" });
      continue;
    }
    const title = enwiki[r.qid];
    const generic = title && norm(title) === slug(`${r.brand} ${r.model}`);
    if (generic)
      cov.note = `Wikipedia „${title}” covers the whole model line; infobox not used`;
    if (title && !generic && (!years || !body)) {
      if (!cache[r.qid]) {
        const p = await get("https://en.wikipedia.org/w/api.php", {
          action: "parse",
          page: title,
          prop: "wikitext|revid",
          section: "0",
          redirects: "1",
        });
        const text: string = p.parse?.wikitext ?? "";
        cache[r.qid] = {
          title: p.parse?.title ?? title,
          revid: p.parse?.revid,
          production: field(text, "production"),
          body_style: field(text, "body_style"),
        };
      }
      wp = cache[r.qid];
      if (!years && wp.production) {
        const ys = [...wp.production.matchAll(/\b(19|20)\d{2}\b/g)].map((m) =>
          Number(m[0]),
        );
        if (ys.length) {
          const present = /present/i.test(wp.production);
          years = {
            from: Math.min(...ys),
            to: present ? Number(RETRIEVED_ON.slice(0, 4)) : Math.max(...ys),
          };
          if (present)
            cov.note = `production "${wp.production}": year_to = retrieval year`;
        }
      }
      if (!body) body = firstBody(wp.body_style);
    }
    cov.enwiki = title ?? null;
    cov.years = years;
    cov.body = body;
    coverage.push(cov);
    if (!years || !body || years.from < 2000) continue;
    const yearsSource =
      r.year_from !== null && r.year_to !== null ? "wikidata" : "wikipedia";
    const wpUrl = wp
      ? `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(wp.title.replace(/ /g, "_"))}&oldid=${wp.revid}`
      : null;
    complete.push({
      id: slug(`${r.brand} ${r.model} ${r.generation}`),
      brand: r.brand,
      model: r.model,
      generation: r.generation,
      years,
      body,
      source:
        yearsSource === "wikidata" && r.body
          ? {
              source_title: `Wikidata ${r.qid}: ${r.label}`,
              source_url: `https://www.wikidata.org/wiki/${r.qid}`,
              retrieved_on: wd.retrieved_on,
              license: "CC0 1.0",
            }
          : {
              source_title: `Wikidata ${r.qid} (identitate, CC0) + Wikipedia „${wp?.title}” rev. ${wp?.revid} (ani, caroserie)`,
              source_url: wpUrl ?? `https://www.wikidata.org/wiki/${r.qid}`,
              retrieved_on: RETRIEVED_ON,
              license: "CC0 1.0 (Wikidata) + CC BY-SA 4.0 (Wikipedia)",
            },
      wikidata: r.qid,
    });
  }

  // Second identity source: the models of data/cars.template.csv (years from German Wikipedia, pinned revisions;
  // body from ADAC, licence unconfirmed — acceptable only because the demo catalog is never published).
  const { parseCsv } = await import("../src/lib/importCsv.ts");
  const t = parseCsv(readFileSync("data/cars.template.csv", "utf8"));
  const h = t[0];
  const seenCsv = new Set<string>();
  for (const cells of t.slice(1)) {
    const c = Object.fromEntries(h.map((k, i) => [k, cells[i] ?? ""]));
    if (seenCsv.has(c.id)) continue;
    seenCsv.add(c.id);
    const dup = complete.findIndex(
      (x) =>
        x.brand === c.brand &&
        x.model === c.model &&
        (slug(String(x.generation)) === slug(c.generation) ||
          Math.abs((x.years as { from: number }).from - Number(c.year_from)) <=
            1),
    );
    if (dup >= 0) complete.splice(dup, 1);
    complete.push({
      id: c.id,
      brand: c.brand,
      model: c.model,
      generation: c.generation,
      years: { from: Number(c.year_from), to: Number(c.year_to) },
      body: c.body,
      source: {
        source_title: `${c.years_source_title} (ani); caroserie: ${c.body_source_title}`,
        source_url: c.years_source_url,
        retrieved_on: c.years_date,
        license: `${c.years_license} (ani); caroserie: licență neconfirmată (doar DEMO)`,
      },
    });
  }

  // Selection: newest generations first, at most MAX_PER_LINE per model line and MAX_ROWS in total.
  complete.sort(
    (a, b) =>
      (b.years as { from: number }).from - (a.years as { from: number }).from,
  );
  const perLine: Record<string, number> = {};
  const chosen = [];
  const ids = new Set<string>();
  for (const c of complete) {
    const key = `${c.brand} ${c.model}`;
    if ((perLine[key] ?? 0) >= MAX_PER_LINE || ids.has(c.id as string))
      continue;
    perLine[key] = (perLine[key] ?? 0) + 1;
    ids.add(c.id as string);
    chosen.push(c);
    if (chosen.length >= MAX_ROWS) break;
  }
  chosen.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  writeFileSync(
    "data/demo-models.json",
    JSON.stringify({ generated_on: RETRIEVED_ON, models: chosen }, null, 2) +
      "\n",
  );
  writeFileSync(
    "data/wikidata/coverage.json",
    JSON.stringify(coverage, null, 2) + "\n",
  );
  writeFileSync(CACHE, JSON.stringify(cache, null, 2) + "\n");
  console.log(
    `✓ ${complete.length} complete identities, ${chosen.length} chosen for the demo catalog`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

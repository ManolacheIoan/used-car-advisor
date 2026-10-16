/**
 * Public-build gate (npm run audit:public). Pure checks; the script feeds them the public catalog, the brand
 * files and the text of every file in out/. Any finding fails the build.
 */
import type { Catalog } from "./types";

export const PRICE_MAX_AGE_DAYS = 60;
export const PRICE_MIN_LISTINGS = 10;
/** Listing sites whose data must never appear in the public build. */
export const LISTING_SITES = [
  "autovit",
  "olx.ro",
  "mobile.de",
  "autoscout24",
  "publi24",
  "lajumate",
  "anuntul.ro",
];
/** Markers that only demo or draft content produces. */
export const DEMO_MARKERS = [
  "DEMO: valori fictive",
  "preț sintetic DEMO",
  "CIORNĂ (vizibilă doar în DEMO)",
];
const UNKNOWN_LICENSES = ["", "unknown", "necunoscut", "synthetic"];

const known = (l: string | undefined) =>
  !!l &&
  !UNKNOWN_LICENSES.includes(l.trim().toLowerCase()) &&
  !/neconfirmat|doar demo/i.test(l);
const days = (from: string, to: string) =>
  (Date.parse(to) - Date.parse(from)) / 86_400_000;

export function auditCatalog(c: Catalog, today: string): string[] {
  const out: string[] = [];
  for (const m of c.models) {
    const id = m.id;
    if (m.is_demo) out.push(`${id}: is_demo=true`);
    if (!m.verified) out.push(`${id}: verified=false`);
    if (!m.sources.length) out.push(`${id}: no sources`);
    for (const s of m.sources) {
      if (!s.source_url) out.push(`${id}: source without source_url`);
      if (!s.retrieved_on)
        out.push(`${id}: source without retrieved_on (${s.source_url})`);
      if (!known(s.license))
        out.push(
          `${id}: source without a confirmed license (${s.source_url}: "${s.license ?? ""}")`,
        );
    }
    const p = m.price_eur;
    if (p) {
      if (p.is_demo || p.kind !== "asking_price")
        out.push(`${id}: price is not a manual asking price`);
      if (!p.verified) out.push(`${id}: price verified=false`);
      if (p.n_listings === null || p.n_listings < PRICE_MIN_LISTINGS)
        out.push(`${id}: price n_listings < ${PRICE_MIN_LISTINGS}`);
      const age = days(p.collected_on, today);
      if (!(age >= 0 && age <= PRICE_MAX_AGE_DAYS))
        out.push(
          `${id}: price collected_on ${p.collected_on} not within ${PRICE_MAX_AGE_DAYS} days`,
        );
      if (!p.source_url) out.push(`${id}: price without source_url`);
      if (!known(p.license))
        out.push(`${id}: price without a confirmed license`);
    }
  }
  return out;
}

/** Every logo/image in public/brands must have <id>.LICENSE.txt next to it. */
export function auditBrandFiles(files: string[]): string[] {
  return files
    .filter((f) => /\.(svg|png|jpe?g|webp|gif)$/i.test(f))
    .filter(
      (f) => !files.includes(`${f.replace(/\.[a-z]+$/i, "")}.LICENSE.txt`),
    )
    .map(
      (f) =>
        `public/brands/${f}: no licence file (${f.replace(/\.[a-z]+$/i, "")}.LICENSE.txt)`,
    );
}

/** Text of built files: no listing-site data, no demo or draft markers. */
export function auditText(files: Record<string, string>): string[] {
  const out: string[] = [];
  for (const [name, text] of Object.entries(files)) {
    const lower = text.toLowerCase();
    for (const site of LISTING_SITES)
      if (lower.includes(site)) out.push(`${name}: contains "${site}"`);
    for (const marker of DEMO_MARKERS)
      if (text.includes(marker))
        out.push(`${name}: contains demo/draft marker "${marker}"`);
  }
  return out;
}

/** Draft guides must not be built. */
export function auditDrafts(
  draftSlugs: string[],
  builtPaths: string[],
): string[] {
  return draftSlugs
    .filter((s) => builtPaths.some((p) => p.startsWith(`ghiduri/${s}/`)))
    .map((s) => `draft guide "${s}" is in the public build`);
}

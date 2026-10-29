# Used Car Advisor — "AlegeMasina"

A static web app that helps people in Romania choose a used car. The user answers a short three-step form (budget,
usage, preferences) and gets a ranked list of models with a transparent score, the reasons behind it and an estimated
monthly running cost. I built it so that **every number on the page can be traced to a source or a formula**: nothing
is filled in from memory, and unverified or unlicensed data never reaches the public build.

The site content is in Romanian, for a local audience.

**Live preview:** https://manolacheioan.github.io/used-car-advisor/

**Tech stack:** Next.js 16 (App Router, static export) · React 19 · TypeScript · Tailwind CSS 4 · Vitest ·
Playwright · axe-core · Lighthouse CI · GitHub Actions

---

## What I built

- **Recommendation form and ranking:** hard filters (fuel, body type, brand, seats), then a 0–100 score from budget
  fit, monthly cost and usage fit. Every result shows the reasons for its score as positive or negative chips. When
  nothing matches, the page shows how many models each relaxed filter would bring back.
- **Catalog** with filters and client-side fuzzy search (fuse.js), plus brand, model and generation pages generated
  from the data.
- **Side-by-side comparison** of up to 4 models, with the best value in each row highlighted only when it is
  meaningful (never across different consumption test cycles).
- **Calculators:** total cost of ownership over 5 years (fuel, insurance, road tax, inspection, vignette,
  maintenance, depreciation) with a chart and a table, a loan calculator (annuity formula) and a monthly budget
  helper.
- **Shareable state:** cost assumptions live in the URL, so results, comparison and detail pages stay consistent and
  can be shared. Favourites and recently viewed models are kept in `localStorage` and can be exported as JSON.
- **Content:** guides, glossary and FAQ written in Markdown, with a `draft` / `published` status, and trust pages
  (methodology, data, sources, privacy, terms).
- **Data pipeline:** a CSV import with per-row validation and a report, a Wikidata/Wikipedia collector that follows
  the Wikimedia API rules, a link checker that respects `robots.txt`, and a public-build audit.
- **PWA:** web manifest, original icons, a service worker with an offline page.
- **Original visuals:** body-type silhouettes and an animated hero car drawn in SVG, and Open Graph images generated
  at build time. Brand logos are never drawn or imitated: a text badge is shown unless an official file is added together
  with its licence file.

## Decisions and why

| Decision                                                               | Why                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Static export, no backend**                                          | No accounts, cookies or trackers, near-zero hosting cost and a small attack surface. The `out/` folder runs on any static host.                                                                                                               |
| **Transparent, rule-based score** (`src/lib/scoring.ts`)               | Users can see exactly why a car ranks where it does. Weights are fixed (40% budget, 30% monthly cost, 30% usage), usage rules live in one config file with a reason each, and the Methodology page is generated from the same code.           |
| **Budget scored against the maximum only**                             | A car cheaper than the budget is never penalised. The score drops only above the maximum, linearly to zero at +20%, so it is continuous at every edge.                                                                                        |
| **Two data modes** (`DATA_MODE=public` / `demo`)                       | The UI can be developed and tested against a full catalog while the public build accepts only complete, verified rows with a confirmed licence. The catalog is swapped at build time with a `resolveAlias` in `next.config.ts`.               |
| **A public-build audit that fails the build** (`npm run audit:public`) | It checks the built `out/` folder for unverified or unlicensed rows, prices that break the rules (at least 10 listings, at most 60 days old), logos without a licence file, draft guides and listing-site data. It runs in CI and on Netlify. |
| **Source, date and licence on every field group**                      | Each group of fields in the CSV (years, body, seats, boot, engine, price) carries its own source title, URL, retrieval date and licence. A value without a source stays empty and shows up in the import report.                              |
| **No conversion between NEDC and WLTP**                                | There is no universal factor, so any conversion would be an invented estimate. Every consumption value shows its test cycle, and mixed cycles get a note.                                                                                     |
| **Empty cost defaults instead of guesses**                             | Insurance, road tax, inspection and maintenance have no default unless an official source exists (`src/config/costDefaults.ts`). Empty fields count as 0 and are listed next to the result.                                                   |
| **Wikidata through the MediaWiki API, not SPARQL**                     | `robots.txt` disallows the SPARQL endpoint. The collector uses a descriptive User-Agent and at most one request per second.                                                                                                                   |
| **CSP with `'unsafe-inline'`, everything else strict**                 | The Next static export uses inline scripts and there is no server to generate a nonce. The rest of the policy (`netlify.toml`) is `self`-only, with `frame-ancestors 'none'` and `object-src 'none'`.                                         |

More decisions, with the alternatives I considered, are in [docs/DECISIONS.md](docs/DECISIONS.md).

## Quality

**Automated testing**

- 234 unit tests (Vitest) on the pure logic: scoring, monthly cost, TCO, loan, budget, CSV import, audit, catalog
  filters, SEO, URL validation, plus edge cases (loan at 0% and 100% interest, 1 and 120 months, 100% depreciation,
  0 km, ranking ties).
- 45 Playwright end-to-end tests on a mobile profile: the main flow, calculators, favourites, PWA, the axe audits,
  and a separate project that checks the public build contains no generated or draft content.
- The CI pipeline (GitHub Actions) runs formatting, lint, typecheck, unit tests, the public build and its audit,
  end-to-end tests and Lighthouse CI. A separate step warns when fuel prices or the exchange rate are out of date. A
  second workflow runs the unit tests and publishes the preview to GitHub Pages.

**Accessibility**

- axe audit (WCAG 2.1 A/AA) on 15 pages, in both the dark and the light theme.
- Animations use only `transform` and `opacity` and stop under `prefers-reduced-motion`.
- Scrollable tables are focusable, and the catalog search is an accessible combobox.

**Performance**

- Lighthouse CI asserts a score of at least 0.9 for performance, accessibility and best practices on every tested
  page, and for SEO on indexable pages.
- Static HTML, fonts self-hosted at build time, the TCO chart loaded on demand, and no layout shift from the form,
  catalog or count-up numbers.

**Security and privacy**

- Security headers in `netlify.toml`: CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, a strict `Referrer-Policy` and a
  restrictive `Permissions-Policy`.
- No third-party requests at runtime; user data stays in the browser.

## Project structure

```
src/app/                 pages (App Router; route folders use the Romanian URLs), sitemap, robots, manifest, OG images
src/components/          form, results, catalog, compare, calculators, TCO chart, badges, PWA
src/config/              usage rules, fuel prices, exchange rate, cost defaults, scenarios, official links
src/lib/                 pure, tested logic: scoring, cost, tco, finance, budget, catalog, importCsv, audit, seo
src/data/                public and local catalogs (JSON) and the catalog schema
content/guides/          guides, glossary and FAQ in Markdown
data/                    source CSV, sources and method, Wikidata collection, generated reports
scripts/                 CSV import, catalog generation, Wikidata collector, audit, coverage, link checker
tests/unit/              Vitest
tests/e2e/               Playwright + axe
docs/                    architecture, decisions, generated catalog formula
```

## Running locally

```bash
npm install
npm run dev               # development: http://localhost:3000 (full local catalog)
npm run build             # public static export to out/
npm run serve             # serves out/ at http://localhost:3000
npm run build:demo        # build with the full local catalog to out-demo/ (used for the GitHub Pages preview)
npm run lint
npm run typecheck
npm test                  # unit tests (Vitest)
npm run test:e2e          # Playwright + axe (run npm run build and npm run build:demo first)
npm run audit:public      # public-build gate (run after npm run build)
```

## Configuration

- **Catalog data:** `data/cars.template.csv`, one row per engine. `npm run import:cars` writes
  `src/data/cars.public.json` and `data/import-report.md`; only complete, verified and licensed models are imported.
- **Score:** weights in `src/lib/scoring.ts`, usage rules in `src/config/usageRules.ts`.
- **Running costs:** fuel prices in `src/config/fuelPrices.ts`, EUR/RON rate in `src/config/exchangeRate.ts`, fixed-cost
  defaults in `src/config/costDefaults.ts`. Each value carries its source and date.
- **Site name, URL and contact:** `src/lib/site.ts`.
- **Data mode:** `DATA_MODE=public|demo` at build time (`next.config.ts`).
- **Sub-path hosting:** `BASE_PATH` (for example `/used-car-advisor`) and `SITE_URL` (the absolute URL, including the
  sub-path) at build time. Links, assets, the manifest, the service worker and canonical URLs follow them.

## Deployment

- **GitHub Pages (preview):** `.github/workflows/pages.yml` builds the local catalog under `/used-car-advisor/` on
  every push to `main` and publishes it. Every page keeps the banner that marks the values as illustrative, and
  `noindex`. GitHub Pages does not support
  custom HTTP headers, so the security headers from `netlify.toml` do not apply there.
- **Netlify (public build):** `netlify.toml` builds in public mode, runs the audit, publishes `out/` and sets the
  security and cache headers. For any other static host, run `npm run build` and publish `out/`.

## Fonts

Barlow Semi Condensed (headings), SIL Open Font License (`assets/fonts/OFL.txt`).

---

_The public catalog accepts only verified, licensed rows and is currently empty. The live preview and the local
catalog (`npm run dev`) combine model identities from Wikidata and Wikipedia with generated specifications and prices,
documented in [docs/DEMO_DATA.md](docs/DEMO_DATA.md); they are not real market prices._

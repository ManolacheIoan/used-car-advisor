# Decisions

Format: decision — alternatives considered — reason.

- **Public MediaWiki API instead of SPARQL for Wikidata** — alternatives: SPARQL (disallowed by `robots.txt` on
  query.wikidata.org), plain `/wiki/Q` pages (no search) — follows the Wikimedia API rules (descriptive User-Agent,
  at most 1 request per second).
- **Production years and body type for the demo catalog come from the infobox of the (English) Wikipedia article
  linked to the Wikidata item** — alternatives: Wikidata only (about 5 % have years, almost none have a body type),
  rows without years or body type — Wikidata does not hold these fields; Wikipedia is an open source
  (CC BY-SA 4.0), with a pinned revision per field.
- **The ADAC data licence stays "unknown"** — alternative: "manufacturer facts" — the ADAC reuse terms have not been
  reviewed, so the public audit rejects these rows until they are.
- **The demo catalog has 54 models, below the 60–80 target** — alternatives: filling in from memory (not allowed),
  general Wikipedia articles (years of the whole model line, which is wrong) — Wikidata and Wikipedia have no
  per-generation years or body type for the rest; values are not guessed.
- **The demo also includes the 30 models from the CSV** (years from German Wikipedia, body type from ADAC with an
  unconfirmed licence) — alternative: Wikidata only (27 models) — the demo catalog is never published, and the public
  audit blocks unlicensed data.
- **Electric and hybrid models are left out** — alternative: including them with a hybrid/electric energy type — V1
  covers only petrol, diesel and LPG; the schema already supports the other types.
- **"Popular brands" on the home page = the brands with the most generations in the catalog** — alternatives:
  registration statistics (no imported source), alphabetical order — popularity is not invented; the rule is
  transparent.
- **Default values for RCA 1200 / road tax 300 / maintenance 2000 RON per year were removed** — alternative: keeping
  them as "approximate" — they had no source. The score does not change (a fixed cost equal for every model does not
  change the order).
- **Hover lift removed from cards that contain controls** (results, catalog) — alternative: keeping it — moving the
  card under the pointer shifted the click target; it stays on cards that are only a link.
- **The link checker does not run in CI** (manual only, with `--strict` before hosting) — alternative: a CI step — the
  result depends on the network and on external sites (timeouts, 503s), which would make CI flaky; the report is in
  `data/link-report.md`.
- **Wikipedia links pinned to a revision (`/w/index.php?oldid=`) are not checked automatically** — alternative:
  ignoring `robots.txt` — `robots.txt` disallows `/w/`; they are reported as "not checked (robots.txt)".
- **CSP with `'unsafe-inline'` for scripts and styles** — alternative: nonce/hash — the Next static export uses inline
  scripts and there is no server to generate a nonce; the rest of the policy is strict (`self`,
  `frame-ancestors 'none'`, `object-src 'none'`).

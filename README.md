# AlegeMasina — „Alege mașina potrivită”

Platformă statică, în română, pentru alegerea unei mașini second-hand în România. Ce conține:

- un formular de recomandări cu scor transparent;
- un catalog cu filtre;
- pagini pentru fiecare marcă, model și generație;
- comparație pentru până la 4 modele;
- calculatoare: cost total, rată, buget lunar;
- favorite și modele văzute recent;
- ghiduri și pagini despre date și surse.

Nu are backend, conturi, cookies sau trackere. Proiect de portofoliu: încă nu e găzduit.

## Stack

Next.js 16 (App Router, `output: "export"`), TypeScript, Tailwind CSS v4, Vitest, Playwright (cu axe), ESLint,
Prettier, Lighthouse CI, GitHub Actions. Biblioteci: `fuse.js` (căutare) și `marked` (Markdown, folosit doar la build).
Găzduire țintă: Netlify (`netlify.toml`); folderul `out/` merge pe orice host static.

## Moduri de date (`DATA_MODE`)

| Mod                                    | Catalog                                                                               | Folosire                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `public` (implicit la `npm run build`) | `src/data/cars.public.json`: doar rânduri complete, verificate, cu licențe confirmate | singurul publicat (`out/`)                                    |
| `demo` (implicit la `npm run dev`)     | `src/data/cars.demo.json`: identitate din Wikidata/Wikipedia, restul valori sintetice | doar local (`out-demo/`): banner DEMO, `noindex`, sitemap gol |

Formula valorilor demo e în `docs/DEMO_DATA.md`.

**Vitrină (doar pentru screenshot-uri de portofoliu):** `npm run build:showcase && npm run serve:showcase` face un build
demo fără banner și fără etichete DEMO, în `out-showcase/`. Datele rămân sintetice și paginile au `noindex`; build-ul
pică dacă `SHOWCASE=1` e folosit fără `DATA_MODE=demo`, iar Netlify publică doar `out/`. Nu se publică. Ghidurile cu `status: draft` apar doar în demo.

## Comenzi

```
npm run dev                 dezvoltare (demo)
npm run build               build public în out/
npm run build:demo          build DEMO în out-demo/ (doar local)
npm run build:showcase      build vitrină (date demo fără etichete) în out-showcase/, pentru screenshot-uri; nu se publică
npm test                    teste unitare (Vitest)
npm run test:e2e            Playwright: demo (fluxuri, axe, PWA) + public (excluderi); necesită ambele build-uri
npm run audit:public        poarta publică: pică la date demo/neverificate/fără licență, ciorne, site-uri de anunțuri
npm run import:cars         CSV → src/data/cars.public.json + data/import-report.md
npm run report:coverage     acoperirea datelor pe model → data/coverage-report.md
npm run check:links [-- --strict]   verifică linkurile (robots.txt, ≤ 1 cerere/s) → data/link-report.md
npm run fetch:wikidata && npm run build:demo-identities && npm run build:demo-data   reface catalogul demo
npm run lint | typecheck | format
```

**Notă:** după orice `npm install <pachet>` pe macOS, regenerează lockfile-ul
(`rm -rf node_modules package-lock.json && npm install`). Altfel `npm ci` din CI (Linux) pică.

## Datele publice: din CSV în catalog

1. `data/cars.template.csv` are un rând pe motorizare.
2. Fiecare grup de câmpuri (`years`, `body`, `seats`, `trunk`, `engine`) are
   `<grup>_source_title`, `_source_url`, `_date` și `_license`.
3. `consumption_cycle` este `NEDC`, `WLTP` sau `unknown`; valorile nu se convertesc între cicluri.
4. Prețul se introduce manual, ca preț cerut în anunțuri:
   - `price_low_eur` și `price_high_eur`;
   - `n_listings` (cel puțin 10);
   - `collected_on` (cel mult 60 de zile înainte de import);
   - `kind` = `asking_price`;
   - `notes`, `price_source_title`, `price_source_url`, `price_license`, `price_verification`.
5. Schimbă `verification` în `verified` doar după ce verifici rândul față de surse.
6. Rulează `npm run import:cars`. Ce intră în `cars.public.json`:
   - doar modelele complete, verificate și cu licență confirmată;
   - prețul, doar dacă e verificat;
   - restul apar în `data/import-report.md`, cu câmpurile fără sursă.
7. `npm test` leagă `cars.public.json` de CSV, iar `npm run audit:public` verifică build-ul.

Sursele și metoda pentru cele 30 de modele din CSV sunt în `data/SOURCES.md`.

## Scorul și costurile

- **Filtre stricte:** combustibil, caroserie, marcă, locuri.
- **Scor** = 40% buget + 30% cost lunar + 30% utilizare. Bugetul se compară doar cu maximul: la sau sub maxim =
  punctaj maxim; scorul scade doar peste buget. Regulile de utilizare, fiecare cu motivul ei, sunt în
  `src/config/usageRules.ts`. Detalii în pagina Metodologie.
- **Cost lunar:** km × consum declarat × preț carburant, plus costurile fixe pe care le introduci tu.
- **Valori implicite** (`src/config/costDefaults.ts`):
  - au valoare doar dacă există o sursă oficială citită;
  - RCA, impozitul, ITP, rovinieta, întreținerea și deprecierea sunt goale, iar utilizatorul le completează.
- **Prețuri carburanți:** `src/config/fuelPrices.ts`, medii din 2026-10-09.
- **Curs EUR/RON:** `src/config/exchangeRate.ts`, 5,33 din 2026-10-16. Apare oriunde există o conversie.
- **Lighthouse (CI):** rulează pe build-ul public (`out/`), care acum are catalogul gol (`cars.public.json` nu are
  încă modele verificate). Scorurile nu reflectă paginile cu date. Rulare locală o singură dată pe build-ul demo
  (2026-10-17, mediana a 3 rulări, 7 pagini, nepublicat): performanță 0,95–0,98, accesibilitate 1,00, bune practici
  1,00, SEO 0,63–0,66 (demo are `noindex`, deci SEO e scăzut intenționat).
- **Vechimea datelor:** CI avertizează (fără să pice) la prețuri de carburant mai vechi de 60 de zile și la un curs
  mai vechi de 30 de zile.

## Sigle și ilustrații

- Nu desenăm și nu imităm sigle. `BrandBadge` afișează o etichetă text originală.
- Un fișier oficial `public/brands/<brand-id>.svg|png` se folosește doar dacă lângă el există
  `<brand-id>.LICENSE.txt`, cu termenii sau permisiunea. Auditul pică pe orice siglă fără licență.
- Siluetele de caroserie și iconițele PWA sunt originale.
- Imaginile Open Graph se generează la build, doar cu text. Fontul este Barlow Semi Condensed (OFL,
  `assets/fonts/OFL.txt`).

## Politica privind sursele

- Doar surse publice, cu URL, dată și licență.
- Nimic completat din memorie: o valoare fără sursă rămâne goală și apare în rapoarte.
- Nu preluăm date de pe site-uri de anunțuri și nu copiem texte sau imagini.
- Respectăm `robots.txt` și facem cereri rare.
- Deciziile luate sunt în `DECISIONS.md`. Ce trebuie făcut de proprietar este în `NEEDS_FROM_ME.md`.

## Înainte de hostare

- [ ] Termenii de utilizare ai fiecărei surse sunt citiți (ADAC, Wikipedia/Wikidata, EEA dacă se importă).
- [ ] Sursele sunt verificate, iar rândurile sunt marcate `verified`.
- [ ] Cel puțin 3 modele sunt comparate manual cu pagini oficiale ale producătorilor.
- [ ] Cursul din `src/config/exchangeRate.ts` este cursul oficial BNR din ziua respectivă, de pe bnr.ro.
- [ ] În `cars.public.json` nu există rânduri demo.
- [ ] Nu se publică ghiduri `draft`; doar cele revizuite au `status: published`.
- [ ] `npm run audit:public` și `npm run check:links -- --strict` trec.
- [ ] Siglele din `public/brands/` au fișier de licență.
- [ ] Istoricul git e curat: datele de preț din anunțuri au fost eliminate (comenzile sunt în `NEEDS_FROM_ME.md`,
      punctul 10).
- [ ] Domeniul real e setat în `SITE.url`. Textele de confidențialitate și termeni au trecut printr-o revizuire
      juridică.

## Deploy (Netlify) — nu este făcut

`netlify.toml` construiește în modul `public`, publică `out/` și setează antetele de securitate și de cache. Pe
Netlify: „Import from Git”, apoi alegi repo-ul. Pentru alt host: `npm run build` și publici `out/`.

# Arhitectură — AlegeMasina

Site static (Next.js 16, App Router, `output: "export"`), fără server, conturi, cookies sau trackere. Datele sunt
fișiere JSON incluse la build. Starea utilizatorului (tema, favoritele, lista de comparație, modelele văzute recent)
stă doar în `localStorage`.

## Două moduri de date

- **public**: build-ul implicit, `out/`, singurul care se publică. Folosește `cars.public.json`, care conține doar
  rânduri complete, verificate și cu licență confirmată. `npm run audit:public` pică la orice abatere.
- **demo**: `npm run dev` sau `build:demo`, `out-demo/`, doar local. Folosește `cars.demo.json`: identitatea modelelor
  vine din surse deschise, iar specificațiile și prețurile sunt sintetice. Fiecare pagină are banner DEMO și
  `noindex`; sitemap-ul e gol, iar ghidurile `draft` sunt vizibile.
- **vitrină** (`SHOWCASE=1`, doar împreună cu demo): același catalog demo fără etichete DEMO, în `out-showcase/`,
  pentru screenshot-uri locale. Rămâne `noindex` și nu se publică.
- Selecția catalogului se face în `next.config.ts`, cu `resolveAlias` pe `@/data/cars.public.json`.

## Structura

```
content/ghiduri/*.md           ghiduri, glosar, întrebări frecvente (front matter: status draft|published, reviewed)
data/cars.template.csv         sursa catalogului public (un rând pe motorizare, sursă și licență pe grup)
data/demo-models.json          identități demo (Wikidata + Wikipedia + CSV), cu sursă pe rând
data/wikidata/                 rezultatul colectării Wikidata, jurnalul de cereri, acoperirea
data/*-report.md               rapoarte: import, acoperire, linkuri
scripts/                       import CSV, date demo, colectare Wikidata, audit, acoperire, linkuri, sigle, date config
src/app/                       pagini: /, catalog, mărci/model/generație, rezultate, comparație, calculatoare,
                               favorite, ghiduri, pagini de încredere, sitemap, robots, manifest, imagini OG
src/components/                UI (catalog, tco, formular, carduri, grafice, badge-uri, PWA)
src/config/                    usageRules, fuelPrices, exchangeRate, costDefaults, officialLinks, scenarios
src/lib/                       logica pură, testată: scoring, cost, tco, finance, budget, catalog, taxonomy,
                               importCsv, audit, attributions, guides, demoData, seo, faq, similar, suitability
tests/unit/                    Vitest (peste 200 de teste)
tests/e2e/                     Playwright: proiect demo (fluxuri, axe, PWA) și proiect public (excluderi)
```

## Fluxul datelor publice

1. Faptele se adună manual sau din surse deschise în `cars.template.csv`, cu titlu, URL, dată și licență pe
   fiecare grup.
2. `npm run import:cars` validează fiecare rând:
   - erori de format → nu scrie nimic;
   - câmpuri, surse sau licențe lipsă → model incomplet;
   - `verification` diferit de `verified` → model exclus;
   - preț neverificat → prețul nu se publică.
     Raportul listează pe model câmpurile fără sursă.
3. Testele leagă `cars.public.json` de CSV. Build-ul generează pagini doar pentru modelele din catalog.
   Recomandările, scenariile și sitemap-ul folosesc doar modele cu preț verificat.
4. `audit:public` rulează pe `out/` și pică la:
   - rânduri demo sau neverificate;
   - surse fără URL, dată sau licență confirmată;
   - prețuri în afara regulilor (cel puțin 10 anunțuri, cel mult 60 de zile);
   - sigle fără licență;
   - ghiduri draft;
   - nume de site-uri de anunțuri sau marcaje DEMO.

## Catalogul demo

- Identitatea modelelor (marcă, model, generație) vine din Wikidata, prin API-ul public MediaWiki: User-Agent
  descriptiv, maximum o cerere pe secundă. SPARQL e interzis de `robots.txt`.
- Anii și caroseria vin din infobox-ul articolului Wikipedia legat de același element, cu revizie fixă, doar dacă
  articolul e specific generației.
- Specificațiile și prețurile sunt generate cu o formulă deterministă, cu seed fix (`docs/DEMO_DATA.md`).

## Scorul (`lib/scoring.ts`)

- **Filtre stricte:** combustibil, caroserie, marcă, locuri.
- **Scor** = 100 × (0,40·B + 0,30·C + 0,30·U):
  - B (buget): doar față de bugetul maxim; interval la sau sub maxim = 1 (o mașină mai ieftină nu e penalizată),
    interval parțial peste maxim = 0,5–1 după partea de sub maxim, peste maxim scădere liniară până la 0 la +20%;
  - C (cost): costul lunar normalizat min–max între candidați;
  - U (utilizare): regulile din `config/usageRules.ts`, fiecare cu motivul ei.
- Nu există scor de fiabilitate. Pagina Metodologie se generează din același cod.

## Costuri

- **Lunar** (`lib/cost.ts`): carburant + RCA + impozit + întreținere. Costurile fixe fără sursă oficială sunt `null`
  („necompletat”), calculate cu 0 și semnalate.
- **TCO** (`lib/tco.ts`, pe 5 ani):
  - adaugă ITP (tarif / interval), rovinietă și depreciere (EUR → lei, cu cursul afișat);
  - vederi lunar, anual și 5 ani;
  - grafic cu o singură serie, încărcat la cerere, plus tabel.
- **Finanțare** (`lib/finance.ts`): formula anuității, doar calcul, cu disclaimer.
- **Buget** (`lib/budget.ts`): modelele al căror cost de utilizare intră în bugetul lunar.
- **Consum:** lângă fiecare valoare apare ciclul de test (NEDC, WLTP sau „necunoscut”). Nu se fac conversii; la
  cicluri amestecate apare o notă, iar „cea mai bună valoare” nu se marchează.

## UI, accesibilitate, performanță

- **Stil:** temă întunecată implicit, un singur accent, font de titluri Barlow Semi Condensed (OFL).
- **Animații:** doar `transform` și `opacity`; sunt oprite la `prefers-reduced-motion`.
- **Fără layout shift:** formularul și catalogul se randează static, iar count-up-ul își rezervă lățimea.
- **Tranziții partajate** între rezultate, comparație și detalii, cu `<ViewTransition>` din React.
- **Accesibilitate:** axe (WCAG 2.1 AA) pe 15 pagini, în ambele teme; tabele derulabile focusabile; combobox
  accesibil în catalog.
- **Lighthouse în CI:** performanță, accesibilitate și bune practici ≥ 0,9 pe toate paginile testate; SEO ≥ 0,9 pe
  paginile indexabile. Rulează pe build-ul public, care acum are catalogul gol (rezultatele demo sunt în README).
- **PWA:** manifest, iconițe originale, service worker (pagini network-first, resurse cache-first, pagină offline).

## SEO

- Titluri și descrieri unice, URL canonic peste tot.
- Date structurate: BreadcrumbList; FAQPage pe paginile de model și de întrebări frecvente. Fără ratinguri.
- Imagini OG originale, generate la build pentru fiecare tip de pagină.
- Sitemap: doar pagini indexabile (modele verificate cu preț, ghiduri publicate). Demo: gol și `noindex`.

## Întrebări probabile la interviu

1. **De ce două moduri de date?**
   Ca să poți testa interfața cu un catalog larg fără riscul ca date sintetice sau neverificate să ajungă publice.
   Auditul blochează asta automat.
2. **Cum garantezi proveniența?**
   Sursă, dată și licență pe fiecare grup de câmpuri și pe preț. Importul refuză licențele necunoscute, testele
   leagă JSON-ul de CSV, iar auditul verifică build-ul final.
3. **De ce nu Wikidata prin SPARQL?**
   `robots.txt` interzice `/sparql`. Am folosit API-ul public cu User-Agent descriptiv și o limită de rată.
4. **De ce nu convertești NEDC în WLTP?**
   Nu există un factor universal; orice conversie ar fi o estimare inventată. Afișăm ciclul și avertizăm.
5. **De ce unele costuri sunt goale?**
   Nu am o sursă oficială pentru RCA, impozit, ITP sau rovinietă. Câmpul rămâne gol și utilizatorul îl completează.
6. **Cum ai evitat layout shift-ul și testele instabile?**
   Fallback-uri statice identice, lățime rezervată pentru count-up, fără ridicare la hover pe cardurile cu controale.
   În teste, bifarea se face din tastatură acolo unde bara fixă poate acoperi ținta.
7. **Cum testezi?**
   Funcții pure cu cazuri limită (Vitest); fluxuri, axe, PWA și excluderi publice (Playwright); Lighthouse și audit
   în CI.
8. **Ce urmează?**
   Hibride și electrice, avantaje și dezavantaje din cel puțin două surse, date tehnice din seturi deschise (EEA)
   după confirmarea licenței.

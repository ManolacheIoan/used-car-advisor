# AlegeMasina — „Alege mașina potrivită”

Aplicație web statică, în română, mobile-first. Utilizatorul completează un formular scurt și primește 5–10 modele
second-hand populare în România, cu un scor de potrivire, motivele scorului și un cost lunar orientativ, calculat pe
baza unor ipoteze pe care le poate modifica.

Nu are backend, bază de date, conturi, cookies sau trackere. Criteriile se păstrează în URL. Tema aleasă se păstrează
în `localStorage`.

## Stack

Next.js (App Router, `output: "export"`), TypeScript, Tailwind CSS v4, Vitest, Playwright, ESLint, Prettier,
Lighthouse CI, GitHub Actions. Găzduire: Netlify (`netlify.toml`). Aplicația nu conține cod specific Netlify, așa că
folderul `out/` poate fi publicat pe orice host static (de exemplu Cloudflare Pages).

## Structură

```
src/
  app/                  rute: / (formular), /rezultate, /compara, /masini/[id], /despre-date, sitemap, robots
  components/           StepForm, Results, Compare, CostEditor, ScoreBar, ReasonChips, DetailCost, SiteChrome, ui
  data/cars.json        catalogul (model + generație)
  data/cars.schema.json schema JSON a catalogului
  lib/scoring.ts        scorul (o singură funcție, ponderi documentate)
  lib/cost.ts           costul lunar și ipotezele implicite
  lib/validation.ts     validarea formularului și citirea/scrierea URL-ului
  lib/seo.ts            JSON-LD, ce pagini se indexează
  lib/importCsv.ts      CSV → catalog, cu raport de erori pe rând (folosit de scripts/import-cars.ts)
  lib/site.ts           numele site-ului, URL-ul, emailul de contact (o singură constantă)
tests/unit/             schema datelor, scor, cost, validare, SEO
tests/e2e/              fluxul principal: formular → rezultate → comparație → detalii
```

## Comenzi

```
npm run dev          server de dezvoltare
npm test             teste unitare (Vitest)
npm run build        export static în out/
npm run test:e2e     Playwright (servește out/, deci rulează mai întâi build)
npm run import:cars -- fisier.csv   importă catalogul din CSV
npm run lint | typecheck | format
```

## Cum adaugi un model

Recomandat: prin import din CSV (vezi mai jos). Manual, direct în JSON:

1. Adaugă un obiect în `models` din `src/data/cars.json`. Câmpurile obligatorii sunt în `cars.schema.json`: `id`
   (kebab-case, unic), `brand`, `model`, `generation`, `years`, `body`, `engines[]` (`energy`, `cc`, `hp`,
   `consumption{value, unit}`), `seats`, `trunk_l`, `price_eur{min, max, set_on}` (în euro) și `sources[]` (cel puțin una, cu
   `title`, `url`, `accessed`).
2. Lasă `pros`, `cons` și `known_issues` ca liste goale. Sunt pentru V2 și nu se afișează încă.
3. Actualizează `updated` la data de azi.
4. Rulează `npm test`. Testul pică dacă lipsesc câmpuri sau surse, dacă intervalele sunt inversate, dacă un id se
   repetă sau dacă folosești un tip de energie care nu e activ în V1 (`hibrid`, `electric`).
5. Șterge cele 5 modele `example: true` când ai date reale. Paginile lor nu se indexează și nu apar în sitemap.

## Import din Google Sheets (recomandat)

1. Importă `data/cars.template.csv` într-un Google Sheet. Coloanele sunt fixe: nu le redenumi și nu le șterge.
2. **Un rând pentru fiecare motorizare.** Rândurile aceluiași model stau unul după altul, cu același `id`. Pe rândurile
   următoare, coloanele de model pot fi repetate sau lăsate goale.
3. Fiecare grup de câmpuri are sursa (URL) și data lui (`AAAA-LL-ZZ`):
   - `years_*` pentru ani;
   - `body_*`, `seats_*`, `trunk_*` pentru caroserie, locuri și portbagaj;
   - `engine_*` pentru motorizare;
   - `price_*` pentru preț, în euro (`price_date` devine data prețului).
4. `energy` poate fi `benzina`, `motorina` sau `gpl`. Consumul se scrie în l/100 km și acceptă virgulă zecimală.
   `example` este `true` doar pentru modelele fictive.
5. Exportă din Sheets cu File → Download → CSV, apoi rulează `npm run import:cars -- ~/Downloads/fisier.csv`.
6. Scriptul verifică fiecare rând și afișează erorile cu numărul liniei și id-ul: câmpuri lipsă, surse lipsă sau
   invalide, date invalide, intervale inversate, id-uri duplicate, valori care se contrazic în același model. Dacă
   există o singură eroare, `cars.json` nu se modifică.
7. `pros`, `cons` și `known_issues` (V2) nu sunt în CSV și se păstrează din `cars.json` existent.
8. Rulează `npm test` și fă commit.

## Cum funcționează scorul (`src/lib/scoring.ts`)

1. **Filtre stricte:** combustibilul, caroseria și numărul minim de locuri. Un model care nu se potrivește este
   eliminat. Dacă nu rămâne niciun model, pagina oferă un buton care relaxează un singur criteriu.
2. **Scor 0–100** = 100 × (0,40·Buget + 0,30·Cost + 0,30·Utilizare):
   - **Buget:** dacă intervalul de preț se suprapune cu bugetul, 0,5 + 0,5 × suprapunere / intervalul mai îngust.
     Altfel scade de la 0,5 la 0 pe o distanță de 20% din bugetul maxim.
   - **Cost:** costul lunar comparat cu ceilalți candidați (cel mai ieftin = 1, cel mai scump = 0).
   - **Utilizare:** reguli aditive per tip de folosire, în `src/config/usageRules.ts`, fiecare cu motivul ei; maximul este exact 1.
3. Fiecare regulă îndeplinită sau ratată devine un chip „de ce”. V1 nu are scor de fiabilitate sau calitate.
4. Pentru fiecare model se folosește motorizarea cea mai ieftină la utilizare care se potrivește combustibilului ales.

**Costul lunar** (`src/lib/cost.ts`) = km/12 × consum declarat/100 × preț carburant + (RCA + impozit + întreținere)/12.
Valorile implicite sunt aproximative și pot fi modificate de utilizator. Lângă fiecare cost apare nota „orientativ, de
obicei mai mare decât consumul declarat”. Prețurile implicite ale carburanților sunt în `src/config/fuelPrices.ts`,
împreună cu data actualizării, afișată pe pagina de rezultate. Dacă data e mai veche de 60 de zile, CI afișează un
**avertisment** (nu pică). Actualizează prețurile, data și sursa împreună.

## Politica privind sursele de date

- Doar date din surse publice, cu link și dată de accesare pentru fiecare model.
- Nu inventăm specificații. Nu copiem texte sau imagini de pe alte site-uri.
- Prețurile sunt intervale aproximative, cu data la care au fost stabilite.
- Corecturile se trimit la emailul din `src/lib/site.ts` (`contact@manotek.ro`).

## Deploy (Netlify)

1. Pe Netlify: „Add new site” → „Import from Git” → alege repo-ul. `netlify.toml` setează comanda de build
   (`npm run build`), folderul publicat (`out`) și Node 24.
2. Pune domainul final în `SITE.url` din `src/lib/site.ts`. Este folosit pentru canonical, Open Graph și sitemap.
3. Pentru alt host: rulează `npm run build` și publică folderul `out/`.

# Arhitectură — AlegeMasina

Site static (Next.js App Router cu `output: "export"`). Nu are server, bază de date, conturi sau cookies. Totul se
calculează în browser din `cars.json`, care este inclus în build.

## Structura folderelor

```
data/cars.template.csv     modelul de CSV pentru Google Sheets (un rând pe motorizare)
scripts/import-cars.ts     CLI: CSV → src/data/cars.json, cu raport de erori pe rând
src/
  app/                     rute: / · /rezultate · /compara · /masini/[id] · /despre-date · sitemap · robots
  components/              UI: StepForm, Results, Compare, CostEditor, ScoreBar, ReasonChips, DetailCost
  config/usageRules.ts     regulile de utilizare, fiecare cu punctaj și motiv
  config/fuelPrices.ts     prețurile implicite ale carburanților și data actualizării
  data/                    cars.json (catalogul) și cars.schema.json (schema JSON)
  lib/scoring.ts           filtre stricte, scor, clasament, opțiuni de relaxare
  lib/cost.ts              costul lunar și ipotezele implicite
  lib/validation.ts        validarea formularului; citire/scriere URL (criterii și ipoteze)
  lib/importCsv.ts         parser CSV, grupare pe model, verificări pe rând
  lib/dataChecks.ts        verificări pe care schema nu le poate exprima (id unic, intervale)
  lib/seo.ts               JSON-LD, ce pagini se indexează
tests/unit/                Vitest: date, import, scor, reguli, cost, prețuri, validare, SEO
tests/e2e/                 Playwright: formular → rezultate → comparație → detalii
```

## Fluxul datelor

1. Datele se completează în Google Sheets, după `data/cars.template.csv`. Fiecare grup de câmpuri are sursa și data
   lui.
2. `npm run import:cars -- fisier.csv`:
   - parsează CSV-ul;
   - grupează rândurile pe `id`;
   - verifică fiecare rând (câmpuri lipsă, surse și date, intervale, id-uri duplicate, conflicte în același model);
   - validează rezultatul cu schema JSON.
     La orice eroare, nu scrie nimic. Câmpurile V2 (`pros`, `cons`, `known_issues`) se păstrează din fișierul vechi.
3. `npm test` revalidează `cars.json` cu schema și cu `dataChecks`. CI pică dacă datele sunt invalide.
4. `next build` generează:
   - câte o pagină statică pentru fiecare model (`generateStaticParams`, `dynamicParams = false`);
   - sitemap-ul, fără modelele `example`;
   - `robots.txt`.
5. În browser, formularul scrie criteriile în URL (`/rezultate/?bmin=…`). `Results` le citește, le validează și
   rulează `rank()`. Ipotezele de cost modificate se adaugă tot în URL, așa că linkul se poate distribui.

**Monede:** prețul de achiziție și bugetul sunt în euro, cum apar în anunțurile din România. Costurile lunare sunt
în lei. Nu se face conversie între ele.

## Scorul (`lib/scoring.ts`)

1. **Filtre stricte:** combustibil, caroserie, locuri ≥ cerute. Un model nepotrivit este eliminat. Dacă nu rămâne
   niciunul, `relaxOptions()` arată câte modele ar apărea dacă ar fi relaxat câte un singur criteriu.
2. **Scor** = 100 × (0,40·B + 0,30·C + 0,30·U), rotunjit. Fiecare componentă e între 0 și 1:
   - **B (buget):** dacă intervalul de preț se suprapune cu bugetul, 0,5 + 0,5 × suprapunere / intervalul mai
     îngust. Altfel, 0,5 × (1 − distanța / 20% din bugetul maxim), dar nu sub 0. Funcția e continuă la margine.
   - **C (cost):** normalizare min–max între candidați. Cel mai ieftin primește 1, cel mai scump 0.
   - **U (utilizare):** baza plus punctele regulilor îndeplinite (`config/usageRules.ts`). Maximul este exact 1.
3. Fiecare componentă produce chip-uri „de ce”, pozitive sau negative.
4. Departajarea la egalitate: prețul minim, apoi id-ul. Se afișează maximum 10 rezultate.
5. V1 nu are scor de fiabilitate sau calitate.

## Costul lunar (`lib/cost.ts`)

`carburant = km/an ÷ 12 × consum declarat ÷ 100 × preț/l`, la care se adaugă `(RCA + impozit + întreținere) ÷ 12`.

- Se folosește motorizarea modelului care e cea mai ieftină la utilizare pentru combustibilul ales.
- Valorile negative sau nefinite aruncă `RangeError`.
- Lângă fiecare cifră apare nota „orientativ, de obicei mai mare decât consumul declarat”.
- Un test pică dacă prețurile carburanților au mai mult de 60 de zile.

## Calitate

- CI: Prettier, ESLint, typecheck, Vitest, build, Playwright, Lighthouse CI.
- Lighthouse cere minimum 0,9 la performanță și accesibilitate pe toate paginile, plus SEO pe paginile indexabile.
- Temă întunecată implicit. Un script inline aplică tema luminoasă înainte de randare, ca să nu apară un flash.
- Animațiile respectă `prefers-reduced-motion`.

## Întrebări probabile la interviu

1. **De ce site static și nu un server?**
   Datele se schimbă rar și sunt mici. Static înseamnă găzduire gratuită, fără costuri de operare, viteză mare și
   nicio dată personală stocată.
2. **Cum garantezi că datele sunt corecte?**
   Trei niveluri: raportul pe rând la import, schema JSON și verificările semantice din teste, apoi CI care
   blochează un build cu date invalide. Fiecare câmp are sursă și dată.
3. **De ce sunt combustibilul, caroseria și locurile filtre, iar bugetul nu?**
   Primele trei sunt cerințe ferme ale utilizatorului. Bugetul e flexibil: un model puțin peste buget este încă
   relevant, doar cu scor mai mic.
4. **Cum explici scorul utilizatorului?**
   Funcția este una singură, cu ponderi documentate. Fiecare regulă produce un chip „de ce”, iar pagina „Despre
   date” afișează ponderile direct din cod.
5. **De ce stau criteriile în URL și nu în state sau `localStorage`?**
   Linkul se poate distribui, butonul Back funcționează și nu e nevoie de cookies. Paginile rămân statice.
6. **Cum ai testat?**
   Teste unitare pe funcții pure (scor, cost, import, validare), cu cazuri limită: praguri inclusive, intervale de
   lățime zero, valori invalide. Un test E2E acoperă fluxul principal, iar Lighthouse CI verifică performanța.
7. **Ce ai face diferit la scară mare?**
   Datele ar trece într-un CMS sau într-o bază de date cu revizie editorială, prețurile ar fi actualizate automat
   din surse cu API, iar paginile s-ar regenera incremental.
8. **Ce limitări are?**
   Consumul este cel declarat, deci optimist. Prețurile sunt intervale aproximative. Impozitul e o sumă fixă.
   Lipsesc fiabilitatea, care e planificată pentru V2 cu minimum 2 surse, și mașinile hibride și electrice.

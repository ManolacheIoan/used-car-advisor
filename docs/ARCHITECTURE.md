# Arhitectură — AlegeMasina

Site static (Next.js App Router cu `output: "export"`). Nu are server, bază de date, conturi sau cookies. Totul se
calculează în browser din `cars.json`, care este inclus în build. Tema și favoritele stau doar în `localStorage`.

## Structura folderelor

```
data/cars.template.csv     30 de modele reale (un rând pe motorizare), toate marcate „needs verification”
data/SOURCES.md            metoda de colectare, regula de alegere a motorizărilor, valorile negăsite
data/import-report.md      generat la import: modele incomplete sau neverificate
scripts/import-cars.ts     CSV → src/data/cars.json (doar modele complete și verificate)
scripts/brand-assets.ts    listează siglele oficiale din public/brands → src/data/brandAssets.json
scripts/check-fuel-prices.ts  avertisment în CI când prețurile carburanților sunt vechi
src/
  app/                     / · /rezultate · /compara · /masini/[id] · /favorite · /despre-date · sitemap · robots
  components/              StepForm, Results, Compare, Favorites, Scenarios, CostEditor, CountUp, BrandBadge, BodyIcon
  config/                  usageRules (reguli + motiv), fuelPrices (preț, dată, sursă), scenarios (3 exemple)
  lib/                     scoring, cost, validation, importCsv, dataChecks, favorites, scenarios, seo, brand
tests/unit/                Vitest: date, import, scor, reguli, cost, prețuri, validare, scenarii, favorite, SEO
tests/e2e/                 Playwright: flux principal, relaxare criteriu, favorite/comparație/resetare
```

## Fluxul datelor (CSV → pagini)

1. **Colectare.** Valorile vin din pagini publice descărcate efectiv: anii din Wikipedia (revizie fixă), datele
   tehnice din ADAC Autokatalog. Prețurile second-hand se completează manual. Fiecare grup de câmpuri are titlul
   sursei, URL-ul și data. Modelele fără preț verificat sunt excluse din rezultate, din sitemap și din scenarii.
2. **Import.** `npm run import:cars` citește `cars.template.csv`. Pentru fiecare model:
   - valoare invalidă (număr, URL, dată, interval inversat, id duplicat, conflict) → eroare, nu se scrie nimic;
   - valoare sau sursă lipsă → incomplet, nu se publică, apare în raport;
   - complet → intră în `cars.json`; dacă e încă `needs verification`, primește `verified: false`, apare cu eticheta
     „Date în curs de verificare”, nu e indexat și nu intră în scenarii.
3. **Teste.** Schema JSON și `dataChecks` validează `cars.json`. Un test verifică și că acesta corespunde exact
   CSV-urilor, așa că nu poate fi editat manual pe ascuns.
4. **Build.** Se generează câte o pagină statică pe model, cu JSON-LD și Open Graph. Modelele neverificate primesc
   `noindex` și nu apar în sitemap. Scenariile de pe prima pagină se calculează tot la build, doar din modelele
   verificate.
5. **Browser.** Formularul scrie criteriile în URL. `Results` le validează și rulează `rank()`. Ipotezele de cost
   modificate intră tot în URL, deci linkul copiat reproduce exact rezultatul.

**Monede:** bugetul și prețul mașinii sunt în euro, ca în anunțuri. Costurile lunare sunt în lei. Nu se face
conversie între ele.

## Scorul (`lib/scoring.ts`)

1. **Filtre stricte:** combustibil, caroserie, marcă (implicit „Oricare”), locuri ≥ cerute. Dacă nu rămâne niciun model, `relaxOptions()` arată
   ce criteriu, relaxat singur, aduce rezultate și câte.
2. **Scor** = 100 × (0,40·B + 0,30·C + 0,30·U), rotunjit. Fiecare componentă e între 0 și 1:
   - **B (buget):** dacă prețul se suprapune cu bugetul, 0,5 + 0,5 × suprapunere / intervalul mai îngust. Altfel,
     0,5 × (1 − distanța / 20% din bugetul maxim), dar nu sub 0.
   - **C (cost):** normalizare min–max între candidați (cel mai ieftin = 1).
   - **U (utilizare):** baza plus punctele regulilor din `config/usageRules.ts`. Fiecare regulă are un motiv scris;
     maximul este exact 1. Regulile nu elimină modele.
3. Fiecare componentă produce chip-uri „de ce”. Se afișează maximum 10 rezultate. Nu există scor de fiabilitate.

## Costul lunar (`lib/cost.ts`)

`carburant = km/an ÷ 12 × consum declarat ÷ 100 × preț/l`, plus `(RCA + impozit + întreținere) ÷ 12`.

- Se alege motorizarea cea mai ieftină la utilizare pentru combustibilul ales.
- Prețurile implicite ale carburanților sunt medii naționale, cu dată și sursă afișate. Toate ipotezele se pot
  modifica.
- Lângă fiecare cifră apare nota „orientativ, de obicei mai mare decât consumul declarat”.
- Prețuri mai vechi de 60 de zile → avertisment vizibil în CI. Build-ul nu pică.

## Interfață și animații

- Temă întunecată implicit. Un script inline aplică tema luminoasă înainte de randare, ca să nu apară un flash.
- Titlurile folosesc fontul Barlow Semi Condensed (OFL). Fundalul are linii de viteză animate doar prin `transform`.
- Cardurile au adâncime și se ridică la hover. Bara de scor crește până la valoare, iar costul are count-up.
  Pașii formularului alunecă în direcția navigării.
- Între rezultate, comparație și detalii, titlul și silueta modelului se mută cu `<ViewTransition>` din React, fără
  bibliotecă externă.
- Cu `prefers-reduced-motion` sunt oprite toate animațiile neesențiale, inclusiv fundalul și tranzițiile.
- Layout shift zero: formularul este randat static, iar count-up-ul își rezervă lățimea finală.
- Siglele nu sunt desenate. `BrandBadge` afișează fișierul oficial din `public/brands/` doar dacă îl adaugă
  proprietarul site-ului; altfel, o etichetă text. Siluetele de caroserie sunt originale și generice.
- Comparația are o variantă de print fără elemente de navigare, cu ipotezele de cost tipărite.

## Calitate

- CI: Prettier, ESLint, typecheck, verificarea prețurilor carburanților (doar avertisment), Vitest, build,
  Playwright, Lighthouse CI.
- Lighthouse cere minimum 0,9 la performanță și accesibilitate pe toate paginile, plus SEO pe paginile indexabile.

## Întrebări probabile la interviu

1. **De ce site static?** Datele sunt mici și se schimbă rar. Static înseamnă găzduire gratuită, viteză mare și
   nicio dată personală pe server.
2. **Cum garantezi datele?** Fiecare câmp are sursă și dată. Importul refuză valorile invalide și nu publică
   modelele incomplete sau neverificate. Testele leagă `cars.json` de CSV.
3. **De ce filtre stricte doar la combustibil, caroserie și locuri?** Acestea sunt cerințe ferme. Bugetul și
   utilizarea sunt flexibile, așa că influențează doar scorul.
4. **Cum explici scorul?** O singură funcție, cu ponderi documentate. Fiecare regulă are motiv și chip „de ce”.
5. **De ce criteriile în URL?** Linkul se poate distribui, Back funcționează și nu e nevoie de cookies.
6. **Cum ai făcut animațiile fără să strici performanța?** Doar `transform` și `opacity`, View Transitions native,
   lățime rezervată pentru count-up. Rezultatul: CLS 0 și Lighthouse ≥ 96.
7. **Cum ai testat?** Funcții pure cu cazuri limită (praguri inclusive, intervale de lățime zero, date corupte în
   `localStorage`), scenarii fixate pe un catalog de test, E2E pe fluxurile principale și Lighthouse în CI.
8. **Limitări?** Consumul e cel declarat (NEDC; WLTP la câteva motoare). Prețurile second-hand sunt introduse
   manual. Impozitul e o sumă fixă. Lipsesc fiabilitatea (V2) și mașinile hibride și electrice.

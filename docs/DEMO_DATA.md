# Date DEMO (doar pentru testare locală)

Catalogul demo (`src/data/cars.demo.json`) e folosit doar cu `DATA_MODE=demo`. Nu se publică niciodată. Fiecare
pagină afișează bannerul „DEMO: valori fictive, nu pentru decizii reale” și e marcată `noindex`; sitemap-ul e gol.

## Ce e real și ce e sintetic

- **Real, cu sursă** (`data/demo-models.json`): marca, modelul, generația, anii de producție și caroseria, fiecare
  intrare cu sursa, data accesării și licența.
- **Sintetic**: motorizări, consum, locuri, portbagaj și preț. Nimic nu provine din anunțuri sau din date colectate
  automat de pe site-uri.

## Formula (deterministă, seed fix `20261016`)

Fiecare model are propriul generator pseudo-aleator: `mulberry32(20261016 XOR fnv1a(id))`.

- **Motorizări**: benzină 1400 cm³ (100 CP; SUV 120 CP) și motorină 1600 cm³ (110 CP; SUV 130 CP). Un motor GPL
  1400 cm³ (95 CP) se adaugă dacă `rand() < 0,25`.
- **Consum benzină** (l/100 km) după caroserie: hatchback 5,8, sedan 6,3, break 6,5, SUV 7,2, monovolum 7,0. Motorina
  are cu 1,4 l mai puțin, GPL-ul × 1,25.
- **Ciclu**: WLTP dacă generația s-a produs și în 2019 sau după, altfel NEDC.
- **Locuri**: 7 la monovolum, 5 la rest.
- **Portbagaj** (l): hatchback 340, sedan 480, break 560, SUV 450, monovolum 620.
- **Preț** (EUR) = bază_segment × 0,88^vârstă × factor_combustibil_mediu × (0,9 + 0,2 × `rand()`):
  - bază (segment = caroserie): hatchback 18.000, sedan 26.000, break 27.000, SUV 28.000, monovolum 24.000;
  - vârstă = 2026 − anul din mijlocul perioadei de producție;
  - factor combustibil: benzină 1,00, motorină 1,08, GPL 0,95 (media pe motorizări);
  - interval: ±15 %, rotunjit la 100 €, minimum 500 €.

Regenerare: `npm run build:demo-data`. Același input produce mereu același rezultat.

# Demo data

The demo catalog (`src/data/cars.demo.json`) is used only with `DATA_MODE=demo`: locally and for the GitHub Pages
preview, never for the public (Netlify) build. Every page shows the banner "DEMO: valori fictive, nu pentru decizii
reale" and is marked `noindex`; the sitemap is empty.

## What is real and what is synthetic

- **Real, with a source** (`data/demo-models.json`): brand, model, generation, production years and body type, each
  entry with its source, retrieval date and licence.
- **Synthetic**: engines, consumption, seats, boot volume and price. Nothing comes from listings or from data
  collected automatically from websites.

## Formula (deterministic, fixed seed `20261016`)

Each model has its own pseudo-random generator: `mulberry32(20261016 XOR fnv1a(id))`.

- **Engines**: petrol 1400 cc (100 hp; SUV 120 hp) and diesel 1600 cc (110 hp; SUV 130 hp). An LPG engine of
  1400 cc (95 hp) is added when `rand() < 0.25`.
- **Petrol consumption** (l/100 km) by body type: hatchback 5.8, sedan 6.3, estate 6.5, SUV 7.2, MPV 7.0. Diesel uses
  1.4 l less, LPG × 1.25.
- **Cycle**: WLTP if the generation was still produced in 2019 or later, otherwise NEDC.
- **Seats**: 7 for MPVs, 5 for the rest.
- **Boot volume** (l): hatchback 340, sedan 480, estate 560, SUV 450, MPV 620.
- **Price** (EUR) = segment_base × 0.88^age × average_fuel_factor × (0.9 + 0.2 × `rand()`):
  - base (segment = body type): hatchback 18,000, sedan 26,000, estate 27,000, SUV 28,000, MPV 24,000;
  - age = 2026 − the middle year of the production period;
  - fuel factor: petrol 1.00, diesel 1.08, LPG 0.95 (averaged over the engines);
  - range: ±15 %, rounded to €100, minimum €500.

Regenerate with `npm run build:demo-data`. The same input always produces the same output.

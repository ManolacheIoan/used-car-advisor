# Sources and method — technical data (collected 2026-10-16)

Every value in `data/cars.template.csv` was taken from public pages that were actually downloaded. Only **facts**
(numbers, types) were recorded, with no copied text. Each field group has the source title, the full URL and the
retrieval date. All rows are marked `needs verification`.

## Sources

- **Production years:** the generation infobox on German Wikipedia ("Produktionszeitraum"). The link points to the
  exact revision (`oldid`) used.
- **Body type, seats, boot volume, engines** (displacement, power, combined consumption): ADAC Autokatalog. Each field
  uses the page of the specific variant.
- **Used-car prices:** empty. They are entered by hand as asking prices from listings (`price_low_eur`,
  `price_high_eur`, `n_listings` ≥ 10, `collected_on`, `kind` = `asking_price`, `notes`). Without a price, the model is
  left out of the results.

## Engine selection rule (fixed, not from memory)

From the ADAC variants of the generation (base page and facelift), filtered on the main body type, the selection is:

- at most 2 petrol engines, with the lowest distinct power outputs;
- at most 2 diesel engines, same rule;
- one LPG engine, if there is one.

Sport, 4x4, CNG, hybrid and electric versions are not included. Body type, seats and boot volume are those of the
first selected variant. The power on each variant page was checked automatically against the ADAC list.

## Notes for verification

- **Logan II** is recorded as **Logan MCV (estate)**, because ADAC lists only the MCV version for the second
  generation.
- **Passat B7/B8** are recorded as **Variant (estate)**.
- **Octavia and Superb** are recorded as "sedan": ADAC classifies them as "Stufenheck", although they are liftbacks.
- Consumption is the declared value, with the test cycle in the `consumption_cycle` column: **NEDC** (the NEFZ value
  in ADAC) or **WLTP** where ADAC has no NEDC value (6 rows, listed below). Values are never converted between cycles.
- Years come from Wikipedia (the whole generation, facelift included). The engines may cover only part of those years.

## Missing values and remarks

- `dacia-sandero-3` — years: source says "seit 2021" (still in production); year_to set to retrieval year
- `dacia-sandero-3` — consumption: Dacia Sandero SCe 65 Access (01/21 - 12/22): only WLTP value found, recorded WLTP
- `dacia-sandero-3` — consumption: Dacia Sandero TCe 90 Essential (01/21 - 04/24): only WLTP value found, recorded WLTP
- `dacia-sandero-3` — consumption: Dacia Sandero TCe 100 ECO-G Essential (Autogasbetrieb) (01/21 - 04/24): only WLTP value found, recorded WLTP
- `vw-passat-b8` — consumption: VW Passat Variant 2.0 TDI SCR Conceptline DSG (08/20 - 11/23): only WLTP value found, recorded WLTP
- `opel-astra-k` — consumption: Opel Astra 1.0 ECOTEC DI Turbo Start&Stop Selection (06/18 - 08/19): only WLTP value found, recorded WLTP
- `opel-astra-k` — consumption: Opel Astra 1.5 Diesel (09/19 - 11/20): only WLTP value found, recorded WLTP

## Verification status

Each model is marked `verified` only after it has been checked against its sources. Until then it is shown with the
label "Date în curs de verificare" and is not indexed by search engines.

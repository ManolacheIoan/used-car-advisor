# Surse și metodă — date tehnice (colectate 2026-10-16)

Toate valorile din `data/cars.template.csv` au fost preluate din pagini publice descărcate efectiv.
S-au înregistrat **doar fapte** (cifre, tipuri), fără text copiat. Fiecare grup de câmpuri are titlul sursei,
URL-ul complet și data accesării. Toate rândurile sunt marcate `needs verification`.

## Surse

- **Ani de producție:** infobox-ul generației de pe Wikipedia în germană („Produktionszeitraum”). Linkul
  indică revizia exactă (`oldid`) folosită.
- **Caroserie, locuri, portbagaj, motorizări** (cilindree, putere, consum mixt): ADAC Autokatalog. Pentru fiecare
  câmp este folosită pagina variantei respective.
- **Prețuri second-hand:** goale. Se completează manual; până atunci modelele sunt excluse din rezultate.

## Regula de alegere a motorizărilor (fixă, nu după memorie)

Din variantele ADAC ale generației (pagina de bază și facelift-ul), filtrate pe caroseria principală, se aleg:

- maximum 2 motoare pe benzină, cu cele mai mici puteri distincte;
- maximum 2 motoare diesel, la fel;
- un motor GPL, dacă există.

Nu sunt incluse versiunile sport, 4x4, CNG, hibride și electrice. Caroseria, locurile și portbagajul sunt cele ale
primei variante alese. Puterea de pe pagina variantei a fost verificată automat față de lista ADAC.

## Atenție la verificare

- **Logan II** apare ca **Logan MCV (break)**, pentru că ADAC listează doar versiunea MCV pentru generația a doua.
- **Passat B7/B8** sunt înregistrate ca **Variant (break)**.
- **Octavia și Superb** apar ca „sedan”: ADAC le clasifică „Stufenheck”, deși sunt liftback.
- Consumul este cel declarat, cu ciclul de test în coloana `consumption_cycle`: **NEDC** (valoarea NEFZ din
  ADAC) sau **WLTP**, acolo unde ADAC nu are NEDC (6 rânduri, listate mai jos). Valorile nu se convertesc între cicluri.
- Anii vin de pe Wikipedia (toată generația, inclusiv facelift-ul). Motorizările pot acoperi doar o parte din acești
  ani.

## Valori negăsite sau cu observații

- `dacia-sandero-3` — years: source says "seit 2021" (still in production); year_to set to retrieval year
- `dacia-sandero-3` — consumption: Dacia Sandero SCe 65 Access (01/21 - 12/22): only WLTP value found, recorded WLTP
- `dacia-sandero-3` — consumption: Dacia Sandero TCe 90 Essential (01/21 - 04/24): only WLTP value found, recorded WLTP
- `dacia-sandero-3` — consumption: Dacia Sandero TCe 100 ECO-G Essential (Autogasbetrieb) (01/21 - 04/24): only WLTP value found, recorded WLTP
- `vw-passat-b8` — consumption: VW Passat Variant 2.0 TDI SCR Conceptline DSG (08/20 - 11/23): only WLTP value found, recorded WLTP
- `opel-astra-k` — consumption: Opel Astra 1.0 ECOTEC DI Turbo Start&Stop Selection (06/18 - 08/19): only WLTP value found, recorded WLTP
- `opel-astra-k` — consumption: Opel Astra 1.5 Diesel (09/19 - 11/20): only WLTP value found, recorded WLTP

## De făcut

- Marcajul `verified` pentru fiecare model, după verificare. Până atunci modelele apar cu eticheta „Date în curs de
  verificare” și nu sunt indexate de motoarele de căutare.

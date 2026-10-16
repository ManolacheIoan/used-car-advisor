# Ce trebuie să faci tu (format: fișier · câmp · pași)

1. `data/cars.template.csv` · `*_license` pentru rândurile ADAC (acum „unknown”) · citește termenii de utilizare ADAC Autokatalog; dacă permit reutilizarea faptelor, pune licența/temeiul; altfel înlocuiește valorile cu surse oficiale (producător) și sursele lor.
2. `data/cars.template.csv` · `verification` · verifică fiecare model față de surse; schimbă în `verified`.
3. `data/cars.template.csv` · `price_low_eur`, `price_high_eur`, `n_listings`, `collected_on`, `kind`, `notes`, `price_source_*`, `price_license`, `price_verification` · culege manual prețuri cerute (≥ 10 anunțuri, cel mult 60 de zile).
4. `public/brands/` · `<brand-id>.svg|png` + `<brand-id>.LICENSE.txt` · adaugă sigle oficiale doar cu licența lor (opțional).
5. Decizie licență EEA (CO2/consum autoturisme noi, 2010–2025) · `NEEDS_FROM_ME.md` (confirmă aici) · avizul juridic EEA spune CC BY 4.0 cu atribuire („EEA … original source”), dar exclude conținutul furnizat de terți; datele sunt raportate de statele membre, iar pagina setului nu are termeni proprii. Citește fișa de metadate a setului și confirmă dacă poate fi importat (consum WLTP/NEDC, cilindree, putere). Până atunci nu import nimic.

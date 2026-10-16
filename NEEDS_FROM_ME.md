# Ce trebuie să faci tu (format: fișier · câmp · pași)

1. `data/cars.template.csv` · `*_license` pentru rândurile ADAC (acum „unknown”) · citește termenii de utilizare ADAC Autokatalog; dacă permit reutilizarea faptelor, pune licența/temeiul; altfel înlocuiește valorile cu surse oficiale (producător) și sursele lor.
2. `data/cars.template.csv` · `verification` · verifică fiecare model față de surse; schimbă în `verified`.
3. `data/cars.template.csv` · `price_low_eur`, `price_high_eur`, `n_listings`, `collected_on`, `kind`, `notes`, `price_source_*`, `price_license`, `price_verification` · culege manual prețuri cerute (≥ 10 anunțuri, cel mult 60 de zile).
4. `public/brands/` · `<brand-id>.svg|png` + `<brand-id>.LICENSE.txt` · adaugă sigle oficiale doar cu licența lor (opțional).
5. Decizie licență EEA (CO2/consum autoturisme noi, 2010–2025) · `NEEDS_FROM_ME.md` (confirmă aici) · avizul juridic EEA spune CC BY 4.0 cu atribuire („EEA … original source”), dar exclude conținutul furnizat de terți; datele sunt raportate de statele membre, iar pagina setului nu are termeni proprii. Citește fișa de metadate a setului și confirmă dacă poate fi importat (consum WLTP/NEDC, cilindree, putere). Până atunci nu import nimic.
6. `src/config/costDefaults.ts` · `rcaYear`, `roadTaxYear`, `itpPerInspection`, `itpIntervalYears`, `vignetteYear`, `maintenanceYear`, `depreciationPctYear` · lăsate goale (utilizatorul le introduce). Dacă vrei valori implicite, pune doar valori din surse oficiale (URL + dată): impozit — Codul fiscal + hotărârea consiliului local; ITP — RAR; rovinietă/TollRo — CNAIR/Monitorul Oficial (regimul s-a schimbat la 1 oct. 2026; sursele de presă se contrazic).
7. `src/config/officialLinks.ts` · `rar`, `anpc` · verificarea automată a eșuat (RAR: timeout, ANPC: 503) din mediul de dezvoltare. Deschide-le manual; dacă merg, actualizează `checked` cu data și statusul.
8. `content/ghiduri/*.md` · `status: draft` · toate ghidurile sunt ciorne scrise de mine; citește-le, corectează-le și schimbă în `status: published` doar pe cele aprobate (build-ul public le exclude pe celelalte).
9. `src/app/confidentialitate/page.tsx`, `src/app/termeni/page.tsx` · text · scrise de mine, fără revizuire juridică. Recomand o revizuire juridică înainte de hostare (GDPR, răspundere).
10. Istoric git · commiturile `4a0c784` și `ad057e8` conțin încă prețurile derivate din anunțuri · NU le-am rescris (aștept aprobarea ta). Pași propuși, pe o clonă separată, după backup:
    ```
    brew install git-filter-repo                      # ≥ 2.45
    git clone --mirror https://github.com/ManolacheIoan/alegemasina.git ~/alegemasina-backup.git
    git clone https://github.com/ManolacheIoan/alegemasina.git /tmp/alegemasina-rewrite && cd /tmp/alegemasina-rewrite
    git filter-repo --file-info-callback "$(cat scripts/maintenance/strip-listing-prices.py)" \
      --message-callback 'return message.replace(b" from autovit.ro", b"")'
    git grep -i -e autovit -e "percentila 10" $(git rev-list --all) -- . ':!scripts/maintenance' | wc -l   # 0
    git remote add origin https://github.com/ManolacheIoan/alegemasina.git
    git push --force-with-lease origin main           # doar după aprobare; apoi clonează din nou proiectul
    ```
    GitHub poate păstra o vreme commiturile vechi accesibile după SHA; pentru purjare e nevoie de GitHub Support.
11. `src/lib/site.ts` · `SITE.url` · placeholder `https://alegemasina.netlify.app`; pune domeniul real înainte de hostare.
12. EEA / alte seturi deschise de specificații · importul așteaptă confirmarea ta (vezi punctul 5).

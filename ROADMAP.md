# Roadmap

## Înainte de hostare

Checklist-ul complet este în README („Înainte de hostare”). Ce trebuie făcut de proprietar este în
`NEEDS_FROM_ME.md`.

## V2: avantaje, dezavantaje și probleme cunoscute

- Câmpurile există deja în date: `pros`, `cons`, `known_issues`. Schema cere cel puțin 2 surse.
- Pe pagina de model sunt rezervate secțiuni ascunse.
- Reguli: cel puțin 2 surse independente pentru fiecare afirmație, text parafrazat, formulări prudente („raportat de
  unii proprietari”, cu motorizările și anii afectați), severitate, nivel de încredere, dată și link de corectură.
- Fără influență asupra scorului până la o decizie separată.

## V2: hibrid și electric

Schema acceptă deja `energy: "hibrid" | "electric"` și `unit: "kWh/100km"`. Ce lipsește:

- prețul energiei, cu sursă și dată;
- costul pentru hibride;
- opțiunile din formular și din catalog;
- activarea în `V1_ENERGIES`;
- ghidul de combustibili, actualizat cu cifre din surse.

## Date

- Import din setul EEA (CO2 și consum, cu ciclul de test), după confirmarea licenței (`NEEDS_FROM_ME.md`).
- Câmpurile de cutie de viteze și tracțiune: filtrele există, dar apar doar când există date cu sursă.
- Mai multe caroserii pe generație (de exemplu hatchback și break) ca rânduri separate.
- Impozit auto calculat după cilindree, doar cu baremele oficiale citite din sursă.

## Idei pentru mai târziu

- Comparație: export PDF și salvarea seturilor de comparație.
- Linkuri afiliate sau conținut sponsorizat, doar conform politicii publicate: marcate clar și fără influență
  asupra scorului.

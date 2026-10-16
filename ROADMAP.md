# Roadmap

## V2: avantaje, dezavantaje și probleme cunoscute

Câmpurile există deja în `cars.json` (`pros`, `cons`, `known_issues`) și sunt validate de schemă, dar UI-ul nu le
afișează încă.

- Fiecare afirmație are la bază **cel puțin 2 surse independente** (schema impune deja minimum 2).
- Textul este **parafrazat**, niciodată copiat.
- Formulări prudente, de tipul „raportat de unii proprietari”, cu motorizările și anii afectați.
- Fiecare afirmație are severitate, nivel de încredere, dată și un link de corectură (`contact@manotek.ro`).
- Rămâne de decis: dacă și cum influențează aceste date scorul. În V1 nu există scor de fiabilitate.

## Hibrid și electric

Schema acceptă deja `energy: "hibrid" | "electric"` și `unit: "kWh/100km"`. Ce lipsește:

- prețul energiei în ipotezele de cost (lei/kWh);
- costul pentru hibride (consum mixt);
- opțiunile din formular;
- activarea în `V1_ENERGIES` și în testul de date.

## Idei pentru mai târziu

- Comparație îmbunătățită: evidențierea diferențelor, mai mult de 3 modele pe desktop, link de partajare.
- Linkuri afiliate, marcate clar ca „sponsorizat” și fără influență asupra scorului.

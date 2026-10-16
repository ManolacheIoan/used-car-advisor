/** FAQ generated only from catalog data (no external claims). */
import { DEFAULT_ASSUMPTIONS } from "./cost";
import {
  BODY_LABEL,
  consumptionRange,
  engineSummary,
  lei,
  mixedCycles,
} from "./labels";
import { pickEngine } from "./scoring";
import type { CarModel } from "./types";

export function modelFaq(m: CarModel): { q: string; a: string }[] {
  const name = `${m.brand} ${m.model} ${m.generation}`;
  const { engine, cost } = pickEngine(m, "oricare", 12000, DEFAULT_ASSUMPTIONS);
  return [
    {
      q: `În ce ani s-a produs ${name}?`,
      a: `Conform sursei din catalog, între ${m.years.from} și ${m.years.to}.`,
    },
    {
      q: `Ce motorizări are ${name} în catalog?`,
      a: `${engineSummary(m)}. Lista nu este completă: conține doar motorizările înregistrate în datele noastre.`,
    },
    {
      q: `Ce consum declarat are ${name}?`,
      a: `Între ${consumptionRange(m)}, valori declarate de producător.${
        mixedCycles(m.engines)
          ? " Valorile provin din cicluri de test diferite și nu sunt direct comparabile."
          : ""
      } Consumul real este de obicei mai mare.`,
    },
    {
      q: `Ce caroserie, câte locuri și ce portbagaj are?`,
      a: `${BODY_LABEL[m.body]}, ${m.seats} locuri, portbagaj de ${m.trunk_l} l (valoare declarată).`,
    },
    {
      q: `Cât costă lunar, orientativ?`,
      a: `Cu motorizarea cea mai economică din catalog (${engine.hp} CP) și ipotezele implicite pentru 12.000 km/an, aproximativ ${lei(cost.total)} pe lună. Valoare orientativă; modific-o cu ipotezele tale în calculatorul de mai sus.`,
    },
  ];
}

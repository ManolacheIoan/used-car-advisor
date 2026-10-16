import { SITE } from "./site";
import type { CarModel } from "./types";

/** JSON export of a local list (favorites / recently viewed). Contains only public model identity, no personal data. */
export function exportPayload(
  kind: "favorite" | "recente",
  list: CarModel[],
  date = new Date().toISOString().slice(0, 10),
) {
  return {
    site: SITE.name,
    kind,
    exported_on: date,
    items: list.map((m) => ({
      id: m.id,
      brand: m.brand,
      model: m.model,
      generation: m.generation,
      years: `${m.years.from}–${m.years.to}`,
      url: `${SITE.url}/masini/${m.id}/`,
    })),
  };
}

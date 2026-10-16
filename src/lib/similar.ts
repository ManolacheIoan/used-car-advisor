import type { CarModel } from "./types";

const mid = (m: CarModel) => (m.years.from + m.years.to) / 2;

/**
 * Similar models (transparent rule): same body type, other model lines first, then the closest production
 * period; ties by name. Prices are not used (they may be missing or unverified).
 */
export function similarModels(m: CarModel, all: CarModel[], n = 4): CarModel[] {
  return all
    .filter((x) => x.id !== m.id && x.body === m.body)
    .map((x) => ({
      x,
      sameLine: x.brand === m.brand && x.model === m.model ? 1 : 0,
      d: Math.abs(mid(x) - mid(m)),
    }))
    .sort(
      (a, b) =>
        a.sameLine - b.sameLine ||
        a.d - b.d ||
        `${a.x.brand} ${a.x.model}`.localeCompare(
          `${b.x.brand} ${b.x.model}`,
          "ro",
        ),
    )
    .slice(0, n)
    .map((r) => r.x);
}

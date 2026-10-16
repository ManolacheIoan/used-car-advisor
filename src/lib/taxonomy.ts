/** Brand → model line → generation navigation, derived from the active catalog. */
import { brandId } from "./brand";
import { modelSlug } from "./catalog";
import type { CarModel } from "./types";

export interface ModelLine {
  slug: string;
  name: string;
  generations: CarModel[];
}
export interface BrandGroup {
  id: string;
  name: string;
  lines: ModelLine[];
  count: number;
}

export function groupByBrand(models: CarModel[]): BrandGroup[] {
  const brands = new Map<string, BrandGroup>();
  for (const m of models) {
    const id = brandId(m.brand);
    const b = brands.get(id) ?? { id, name: m.brand, lines: [], count: 0 };
    const slug = modelSlug(m.model);
    let line = b.lines.find((l) => l.slug === slug);
    if (!line) {
      line = { slug, name: m.model, generations: [] };
      b.lines.push(line);
    }
    line.generations.push(m);
    b.count++;
    brands.set(id, b);
  }
  for (const b of brands.values()) {
    b.lines.sort((x, y) => x.name.localeCompare(y.name, "ro"));
    for (const l of b.lines)
      l.generations.sort((x, y) => x.years.from - y.years.from);
  }
  return [...brands.values()].sort((x, y) =>
    x.name.localeCompare(y.name, "ro"),
  );
}

export const yearsSpan = (ms: CarModel[]) =>
  `${Math.min(...ms.map((m) => m.years.from))}–${Math.max(...ms.map((m) => m.years.to))}`;

/** Static export needs ≥ 1 path per dynamic route; this placeholder renders 404 when the catalog is empty. */
export const EMPTY_PARAM = "fara-modele";

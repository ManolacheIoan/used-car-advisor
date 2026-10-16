/**
 * Catalog filtering, sorting and pagination (pure functions; the page keeps the state in the URL).
 * Price filters only ever consider verified prices; models without one are excluded when a price filter is set.
 */
import { brandId } from "./brand";
import type { Body, CarModel, Energy } from "./types";

export const PAGE_SIZE = 12;

export const SORTS = {
  nume: "Nume (A–Z)",
  "an-desc": "Cele mai noi",
  "putere-desc": "Putere (mare → mică)",
  "consum-asc": "Consum declarat (mic → mare)",
  "pret-asc": "Preț verificat (mic → mare)",
} as const;
export type Sort = keyof typeof SORTS;

export interface CatalogFilters {
  q: string;
  brand: string;
  model: string;
  body: Body | "";
  fuel: Energy | "";
  yearFrom: number | null;
  yearTo: number | null;
  hpMin: number | null;
  hpMax: number | null;
  consMax: number | null;
  seats: number | null;
  trunkMin: number | null;
  gearbox: string;
  drive: string;
  priceMin: number | null;
  priceMax: number | null;
  sort: Sort;
  page: number;
}

export const EMPTY_FILTERS: CatalogFilters = {
  q: "",
  brand: "",
  model: "",
  body: "",
  fuel: "",
  yearFrom: null,
  yearTo: null,
  hpMin: null,
  hpMax: null,
  consMax: null,
  seats: null,
  trunkMin: null,
  gearbox: "",
  drive: "",
  priceMin: null,
  priceMax: null,
  sort: "nume",
  page: 1,
};

/** URL keys (short, shareable). */
const KEYS: Record<keyof CatalogFilters, string> = {
  q: "q",
  brand: "marca",
  model: "model",
  body: "caroserie",
  fuel: "combustibil",
  yearFrom: "an_min",
  yearTo: "an_max",
  hpMin: "cp_min",
  hpMax: "cp_max",
  consMax: "consum_max",
  seats: "locuri",
  trunkMin: "portbagaj_min",
  gearbox: "cutie",
  drive: "tractiune",
  priceMin: "pret_min",
  priceMax: "pret_max",
  sort: "sortare",
  page: "pagina",
};

const BODIES: Body[] = ["hatchback", "sedan", "break", "suv", "mpv"];
const FUELS: Energy[] = ["benzina", "motorina", "gpl"];

const num = (s: string | null) => {
  if (s === null || s.trim() === "") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export function filtersFromQuery(q: URLSearchParams): CatalogFilters {
  const f = { ...EMPTY_FILTERS };
  const get = (k: keyof CatalogFilters) => q.get(KEYS[k]);
  f.q = (get("q") ?? "").slice(0, 80);
  f.brand = get("brand") ?? "";
  f.model = get("model") ?? "";
  const body = get("body") ?? "";
  f.body = (BODIES as string[]).includes(body) ? (body as Body) : "";
  const fuel = get("fuel") ?? "";
  f.fuel = (FUELS as string[]).includes(fuel) ? (fuel as Energy) : "";
  for (const k of [
    "yearFrom",
    "yearTo",
    "hpMin",
    "hpMax",
    "consMax",
    "seats",
    "trunkMin",
    "priceMin",
    "priceMax",
  ] as const)
    f[k] = num(get(k));
  f.gearbox = get("gearbox") ?? "";
  f.drive = get("drive") ?? "";
  const sort = get("sort") ?? "";
  f.sort = sort in SORTS ? (sort as Sort) : "nume";
  const page = Number(get("page"));
  f.page = Number.isInteger(page) && page >= 1 ? page : 1;
  return f;
}

/** Only non-default values are written, so URLs stay short. */
export function filtersToQuery(f: CatalogFilters): URLSearchParams {
  const q = new URLSearchParams();
  for (const k of Object.keys(KEYS) as (keyof CatalogFilters)[]) {
    const v = f[k];
    if (v === null || v === "" || v === EMPTY_FILTERS[k]) continue;
    q.set(KEYS[k], String(v));
  }
  return q;
}

export const activeFilterCount = (f: CatalogFilters) =>
  (Object.keys(KEYS) as (keyof CatalogFilters)[]).filter(
    (k) =>
      k !== "sort" &&
      k !== "page" &&
      f[k] !== null &&
      f[k] !== "" &&
      f[k] !== EMPTY_FILTERS[k],
  ).length;

export const modelSlug = (model: string) => brandId(model);

const verifiedPrice = (m: CarModel) =>
  m.price_eur?.verified ? m.price_eur : undefined;

/** `matchIds`: ids allowed by the text search (null = no text search). */
export function filterModels(
  models: CarModel[],
  f: CatalogFilters,
  matchIds: Set<string> | null = null,
): CarModel[] {
  const priceFilter = f.priceMin !== null || f.priceMax !== null;
  return models.filter((m) => {
    if (matchIds && !matchIds.has(m.id)) return false;
    if (f.brand && brandId(m.brand) !== f.brand) return false;
    if (f.model && modelSlug(m.model) !== f.model) return false;
    if (f.body && m.body !== f.body) return false;
    if (f.fuel && !m.engines.some((e) => e.energy === f.fuel)) return false;
    // Production period must overlap the requested years.
    if (f.yearFrom !== null && m.years.to < f.yearFrom) return false;
    if (f.yearTo !== null && m.years.from > f.yearTo) return false;
    if (f.hpMin !== null && !m.engines.some((e) => e.hp >= f.hpMin!))
      return false;
    if (f.hpMax !== null && !m.engines.some((e) => e.hp <= f.hpMax!))
      return false;
    if (
      f.consMax !== null &&
      !m.engines.some((e) => e.consumption.value <= f.consMax!)
    )
      return false;
    if (f.seats !== null && m.seats < f.seats) return false;
    if (f.trunkMin !== null && m.trunk_l < f.trunkMin) return false;
    if (f.gearbox && !m.engines.some((e) => e.gearbox === f.gearbox))
      return false;
    if (f.drive && !m.engines.some((e) => e.drive === f.drive)) return false;
    if (priceFilter) {
      const p = verifiedPrice(m);
      if (!p) return false;
      if (f.priceMin !== null && p.high < f.priceMin) return false;
      if (f.priceMax !== null && p.low > f.priceMax) return false;
    }
    return true;
  });
}

const minCons = (m: CarModel) =>
  Math.min(...m.engines.map((e) => e.consumption.value));
const maxHp = (m: CarModel) => Math.max(...m.engines.map((e) => e.hp));
const label = (m: CarModel) => `${m.brand} ${m.model} ${m.generation}`;

export function sortModels(models: CarModel[], sort: Sort): CarModel[] {
  const byName = (a: CarModel, b: CarModel) =>
    label(a).localeCompare(label(b), "ro");
  const cmp: Record<Sort, (a: CarModel, b: CarModel) => number> = {
    nume: byName,
    "an-desc": (a, b) => b.years.from - a.years.from || byName(a, b),
    "putere-desc": (a, b) => maxHp(b) - maxHp(a) || byName(a, b),
    "consum-asc": (a, b) => minCons(a) - minCons(b) || byName(a, b),
    // Models without a verified price go last.
    "pret-asc": (a, b) =>
      (verifiedPrice(a)?.low ?? Infinity) -
        (verifiedPrice(b)?.low ?? Infinity) || byName(a, b),
  };
  return [...models].sort(cmp[sort]);
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return {
    items: items.slice((current - 1) * size, current * size),
    page: current,
    pages,
    total: items.length,
  };
}

/** Facets present in the data (filters with no data are hidden in the UI). */
export function facets(models: CarModel[]) {
  const engines = models.flatMap((m) => m.engines);
  return {
    gearbox: [
      ...new Set(engines.map((e) => e.gearbox).filter(Boolean)),
    ] as string[],
    drive: [
      ...new Set(engines.map((e) => e.drive).filter(Boolean)),
    ] as string[],
    hasVerifiedPrice: models.some((m) => !!verifiedPrice(m)),
    years: models.length
      ? {
          min: Math.min(...models.map((m) => m.years.from)),
          max: Math.max(...models.map((m) => m.years.to)),
        }
      : null,
  };
}

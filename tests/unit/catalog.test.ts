import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  facets,
  filterModels,
  filtersFromQuery,
  filtersToQuery,
  paginate,
  sortModels,
} from "@/lib/catalog";
import { car, engine, price } from "./fixtures";

const l = (value: number) => ({
  value,
  unit: "l/100km" as const,
  cycle: "NEDC" as const,
});
const models = [
  car({
    id: "golf",
    brand: "Volkswagen",
    model: "Golf",
    generation: "VII",
    years: { from: 2012, to: 2020 },
    body: "hatchback",
    engines: [engine({ hp: 110, consumption: l(5) })],
    price_eur: price(6000, 12000),
  }),
  car({
    id: "octavia",
    brand: "Škoda",
    model: "Octavia",
    generation: "III",
    years: { from: 2013, to: 2020 },
    body: "sedan",
    trunk_l: 590,
    engines: [engine({ energy: "motorina", hp: 150, consumption: l(4.2) })],
    price_eur: price(7000, 13000, { verified: false }),
  }),
  car({
    id: "duster",
    brand: "Dacia",
    model: "Duster",
    generation: "I",
    years: { from: 2010, to: 2017 },
    body: "suv",
    engines: [engine({ energy: "gpl", hp: 105, consumption: l(8) })],
    price_eur: undefined,
  }),
];
const f = (over: Partial<typeof EMPTY_FILTERS>) => ({
  ...EMPTY_FILTERS,
  ...over,
});
const ids = (ms: { id: string }[]) => ms.map((m) => m.id);

describe("filterModels", () => {
  it("filters by brand id (diacritics-insensitive), model slug, body and fuel", () => {
    expect(ids(filterModels(models, f({ brand: "skoda" })))).toEqual([
      "octavia",
    ]);
    expect(ids(filterModels(models, f({ model: "golf" })))).toEqual(["golf"]);
    expect(ids(filterModels(models, f({ body: "suv" })))).toEqual(["duster"]);
    expect(ids(filterModels(models, f({ fuel: "motorina" })))).toEqual([
      "octavia",
    ]);
  });

  it("keeps generations whose production period overlaps the years", () => {
    expect(ids(filterModels(models, f({ yearFrom: 2018 })))).toEqual([
      "golf",
      "octavia",
    ]);
    expect(ids(filterModels(models, f({ yearTo: 2011 })))).toEqual(["duster"]);
  });

  it("filters by power, declared consumption, seats and trunk", () => {
    expect(ids(filterModels(models, f({ hpMin: 120 })))).toEqual(["octavia"]);
    expect(ids(filterModels(models, f({ consMax: 5 })))).toEqual([
      "golf",
      "octavia",
    ]);
    expect(ids(filterModels(models, f({ trunkMin: 500 })))).toEqual([
      "octavia",
    ]);
    expect(ids(filterModels(models, f({ seats: 7 })))).toEqual([]);
  });

  it("price filters use verified prices only", () => {
    expect(ids(filterModels(models, f({ priceMax: 20000 })))).toEqual(["golf"]);
    expect(ids(filterModels(models, f({ priceMin: 13000 })))).toEqual([]);
  });

  it("applies the text-search id set", () => {
    expect(
      ids(filterModels(models, EMPTY_FILTERS, new Set(["duster"]))),
    ).toEqual(["duster"]);
  });
});

describe("sorting and pagination", () => {
  it("sorts by name, year, power, consumption and verified price (unpriced last)", () => {
    expect(ids(sortModels(models, "nume"))).toEqual([
      "duster",
      "octavia",
      "golf",
    ]);
    expect(ids(sortModels(models, "an-desc"))).toEqual([
      "octavia",
      "golf",
      "duster",
    ]);
    expect(ids(sortModels(models, "putere-desc"))).toEqual([
      "octavia",
      "golf",
      "duster",
    ]);
    expect(ids(sortModels(models, "consum-asc"))).toEqual([
      "octavia",
      "golf",
      "duster",
    ]);
    expect(ids(sortModels(models, "pret-asc"))[0]).toBe("golf");
  });

  it("clamps the page", () => {
    const p = paginate([1, 2, 3, 4, 5], 9, 2);
    expect(p).toEqual({ items: [5], page: 3, pages: 3, total: 5 });
    expect(paginate([], 1, 2)).toEqual({
      items: [],
      page: 1,
      pages: 1,
      total: 0,
    });
  });
});

describe("URL state", () => {
  it("round-trips and writes only non-default values", () => {
    const x = f({
      brand: "dacia",
      body: "suv",
      hpMin: 100,
      sort: "an-desc",
      page: 2,
    });
    const q = filtersToQuery(x);
    expect(q.toString()).toBe(
      "marca=dacia&caroserie=suv&cp_min=100&sortare=an-desc&pagina=2",
    );
    expect(filtersFromQuery(q)).toEqual(x);
    expect(activeFilterCount(x)).toBe(3);
  });

  it("ignores invalid values", () => {
    expect(
      filtersFromQuery(
        new URLSearchParams("caroserie=cabrio&cp_min=abc&sortare=x&pagina=-1"),
      ),
    ).toEqual(EMPTY_FILTERS);
  });
});

describe("facets", () => {
  it("hides filters that have no data", () => {
    expect(facets(models)).toMatchObject({
      gearbox: [],
      drive: [],
      hasVerifiedPrice: true,
      years: { min: 2010, max: 2020 },
    });
  });
});

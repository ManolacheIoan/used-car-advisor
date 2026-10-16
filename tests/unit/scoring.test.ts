import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS } from "@/lib/cost";
import {
  budgetFit,
  matchesHard,
  MAX_RESULTS,
  rank,
  relaxOptions,
  usageFit,
  WEIGHTS,
  type Prefs,
} from "@/lib/scoring";
import { car, engine, price } from "./fixtures";

const prefs: Prefs = {
  budgetMin: 30000,
  budgetMax: 50000,
  usage: "mixt",
  fuel: "oricare",
  body: "oricare",
  brand: "oricare",
  seats: 5,
  kmYear: 15000,
};

describe("weights", () => {
  it("sum to 1", () => {
    expect(WEIGHTS.budget + WEIGHTS.cost + WEIGHTS.usage).toBeCloseTo(1);
  });
});

describe("budgetFit", () => {
  it("is 1 when the price range is inside the budget", () => {
    expect(budgetFit({ min: 35000, max: 45000 }, 30000, 50000)).toBe(1);
  });
  it("is 1 when the budget is inside the price range", () => {
    expect(budgetFit({ min: 20000, max: 80000 }, 30000, 50000)).toBe(1);
  });
  it("is 0.75 for half overlap", () => {
    expect(budgetFit({ min: 40000, max: 60000 }, 30000, 50000)).toBeCloseTo(
      0.75,
    );
  });
  it("is 0.5 when ranges just touch", () => {
    expect(budgetFit({ min: 50000, max: 60000 }, 30000, 50000)).toBe(0.5);
  });
  it("decays to 0 at 20% above budget", () => {
    expect(budgetFit({ min: 55000, max: 60000 }, 30000, 50000)).toBeCloseTo(
      0.25,
    );
    expect(budgetFit({ min: 60000, max: 70000 }, 30000, 50000)).toBe(0);
    expect(budgetFit({ min: 90000, max: 99000 }, 30000, 50000)).toBe(0);
  });
  it("handles below-budget models", () => {
    expect(budgetFit({ min: 10000, max: 25000 }, 30000, 50000)).toBeCloseTo(
      0.25,
    );
  });
  it("handles zero-width ranges", () => {
    expect(budgetFit({ min: 40000, max: 40000 }, 40000, 40000)).toBe(1);
    expect(budgetFit({ min: 40000, max: 40000 }, 30000, 50000)).toBe(1);
  });
  it("is within [0, 1]", () => {
    for (const min of [0, 10000, 45000, 70000])
      for (const w of [0, 5000, 50000]) {
        const v = budgetFit({ min, max: min + w }, 30000, 50000);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
  });
});

describe("usageFit", () => {
  it("rewards hatchback + low consumption in the city", () => {
    const u = usageFit(
      car(),
      engine({ consumption: { value: 5, unit: "l/100km", cycle: "NEDC" } }),
      "oras",
    );
    expect(u.score).toBeCloseTo(1);
    expect(u.reasons.every((r) => r.positive)).toBe(true);
  });
  it("adds negative chips for unmet rules", () => {
    const u = usageFit(
      car({ body: "suv" }),
      engine({ consumption: { value: 8, unit: "l/100km", cycle: "NEDC" } }),
      "oras",
    );
    expect(u.score).toBeCloseTo(0.3);
    expect(u.reasons.filter((r) => !r.positive)).toHaveLength(2);
  });
  it("is capped at 1 for every usage", () => {
    const m = car({ body: "break", trunk_l: 600 });
    const e = engine({
      energy: "motorina",
      hp: 150,
      consumption: { value: 4, unit: "l/100km", cycle: "NEDC" },
    });
    for (const u of ["oras", "autostrada", "familie", "mixt"] as const)
      expect(usageFit(m, e, u).score).toBeLessThanOrEqual(1);
  });
});

describe("hard filters", () => {
  it("filter fuel, body, brand and seats", () => {
    const m = car({ body: "sedan", seats: 5 });
    expect(
      matchesHard(m, {
        fuel: "motorina",
        body: "oricare",
        brand: "oricare",
        seats: 5,
      }),
    ).toBe(false);
    expect(
      matchesHard(m, {
        fuel: "benzina",
        body: "suv",
        brand: "oricare",
        seats: 5,
      }),
    ).toBe(false);
    expect(
      matchesHard(m, {
        fuel: "oricare",
        body: "oricare",
        brand: "oricare",
        seats: 7,
      }),
    ).toBe(false);
    expect(
      matchesHard(m, {
        fuel: "benzina",
        body: "sedan",
        brand: "oricare",
        seats: 4,
      }),
    ).toBe(true);
    // brand: fixture brand "Test" → id "test"
    expect(
      matchesHard(m, {
        fuel: "oricare",
        body: "oricare",
        brand: "test",
        seats: 2,
      }),
    ).toBe(true);
    expect(
      matchesHard(m, {
        fuel: "oricare",
        body: "oricare",
        brand: "dacia",
        seats: 2,
      }),
    ).toBe(false);
  });
});

describe("rank", () => {
  it("returns [] when nothing matches", () => {
    expect(rank([car()], { ...prefs, seats: 7 }, DEFAULT_ASSUMPTIONS)).toEqual(
      [],
    );
  });

  it("orders by score and keeps scores in 0–100", () => {
    const cheap = car({
      id: "cheap",
      price_eur: price(30000, 40000),
    });
    const pricey = car({
      id: "pricey",
      price_eur: price(70000, 90000),
    });
    const r = rank([pricey, cheap], prefs, DEFAULT_ASSUMPTIONS);
    expect(r.map((x) => x.model.id)).toEqual(["cheap", "pricey"]);
    for (const x of r) {
      expect(x.score).toBeGreaterThanOrEqual(0);
      expect(x.score).toBeLessThanOrEqual(100);
    }
  });

  it("single candidate gets full cost part", () => {
    const [r] = rank([car()], prefs, DEFAULT_ASSUMPTIONS);
    expect(r.parts.cost).toBe(1);
  });

  it("picks the cheapest-to-run engine of the chosen fuel", () => {
    const m = car({
      engines: [
        engine({
          energy: "benzina",
          consumption: { value: 7, unit: "l/100km", cycle: "NEDC" },
        }),
        engine({
          energy: "benzina",
          consumption: { value: 5, unit: "l/100km", cycle: "NEDC" },
        }),
        engine({
          energy: "motorina",
          consumption: { value: 3, unit: "l/100km", cycle: "NEDC" },
        }),
      ],
    });
    const [r] = rank([m], { ...prefs, fuel: "benzina" }, DEFAULT_ASSUMPTIONS);
    expect(r.engine.consumption.value).toBe(5);
  });

  it("breaks ties deterministically", () => {
    const r = rank(
      [car({ id: "b" }), car({ id: "a" })],
      prefs,
      DEFAULT_ASSUMPTIONS,
    );
    expect(r.map((x) => x.model.id)).toEqual(["a", "b"]);
  });

  it(`returns at most ${MAX_RESULTS} results`, () => {
    const many = Array.from({ length: 15 }, (_, i) => car({ id: `m${i}` }));
    expect(rank(many, prefs, DEFAULT_ASSUMPTIONS)).toHaveLength(MAX_RESULTS);
  });

  it("explains budget and cost in reasons", () => {
    const [r] = rank([car()], prefs, DEFAULT_ASSUMPTIONS);
    expect(r.reasons[0].text).toBe("Integral în buget");
    expect(r.reasons[1].text).toBe("Cost lunar printre cele mai mici");
  });
});

describe("relaxOptions", () => {
  it("lists only relaxations that bring results back", () => {
    const models = [car({ body: "sedan", seats: 5 })];
    const p: Prefs = { ...prefs, body: "suv", fuel: "motorina" };
    expect(relaxOptions(models, p)).toEqual([]);
    expect(relaxOptions(models, { ...p, fuel: "benzina" })).toEqual([
      { key: "body", count: 1 },
    ]);
  });
  it("offers relaxing the brand", () => {
    expect(
      relaxOptions([car({ brand: "Skoda" })], { ...prefs, brand: "dacia" }),
    ).toEqual([{ key: "brand", count: 1 }]);
  });

  it("skips criteria already relaxed", () => {
    expect(relaxOptions([car({ seats: 5 })], { ...prefs, seats: 7 })).toEqual([
      { key: "seats", count: 1 },
    ]);
  });
});

describe("models without a verified price", () => {
  it("are never ranked", () => {
    const { price_eur: _drop, ...noPrice } = car({ id: "no-price" });
    void _drop;
    expect(
      rank([noPrice, car({ id: "priced" })], prefs, DEFAULT_ASSUMPTIONS).map(
        (r) => r.model.id,
      ),
    ).toEqual(["priced"]);
  });
});

import { describe, expect, it } from "vitest";
import { USAGE_RULES } from "@/config/usageRules";
import { DEFAULT_ASSUMPTIONS } from "@/lib/cost";
import { rank, usageFit, type Prefs } from "@/lib/scoring";
import type { Usage } from "@/lib/types";
import { car, engine } from "./fixtures";

const usages = Object.keys(USAGE_RULES) as Usage[];
const l = (value: number) => ({ value, unit: "l/100km" as const });

describe("usage rules config", () => {
  it.each(usages)("%s: base + all points = 1, every rule has a reason", (u) => {
    const { base, rules } = USAGE_RULES[u];
    expect(base + rules.reduce((s, r) => s + r.points, 0)).toBeCloseTo(1);
    for (const r of rules) {
      expect(r.reason.length).toBeGreaterThan(10);
      expect(r.points).toBeGreaterThan(0);
    }
  });

  it.each(usages)("%s: a model meeting no rule scores the base", (u) => {
    const weak = car({ body: "sedan", seats: 4, trunk_l: 200 });
    const e = engine({ energy: "benzina", hp: 60, consumption: l(9) });
    expect(usageFit(weak, e, u).score).toBeCloseTo(USAGE_RULES[u].base);
  });
});

describe("thresholds are inclusive", () => {
  it("city: exactly 6 l/100 km counts as low", () => {
    expect(
      usageFit(car(), engine({ consumption: l(6) }), "oras").score,
    ).toBeCloseTo(1);
    expect(
      usageFit(car(), engine({ consumption: l(6.01) }), "oras").score,
    ).toBeCloseTo(0.7);
  });
  it("highway: exactly 100 CP counts", () => {
    expect(
      usageFit(car(), engine({ hp: 100 }), "autostrada").score,
    ).toBeCloseTo(0.7);
    expect(usageFit(car(), engine({ hp: 99 }), "autostrada").score).toBeCloseTo(
      0.3,
    );
  });
  it("family: exactly 400 l counts", () => {
    expect(
      usageFit(car({ body: "break", trunk_l: 400 }), engine(), "familie").score,
    ).toBeCloseTo(1);
    expect(
      usageFit(car({ body: "break", trunk_l: 399 }), engine(), "familie").score,
    ).toBeCloseTo(0.6);
  });
});

describe("usage never filters", () => {
  const prefs: Prefs = {
    budgetMin: 30000,
    budgetMax: 40000,
    usage: "oras",
    fuel: "oricare",
    body: "oricare",
    seats: 5,
    kmYear: 12000,
  };

  it("a city user still gets small SUVs and sedans that match the other criteria", () => {
    const models = [
      car({ id: "hatch", body: "hatchback" }),
      car({ id: "small-suv", body: "suv", trunk_l: 350 }),
      car({ id: "sedan", body: "sedan" }),
    ];
    const r = rank(models, prefs, DEFAULT_ASSUMPTIONS);
    expect(r.map((x) => x.model.id).sort()).toEqual([
      "hatch",
      "sedan",
      "small-suv",
    ]);
    expect(r[0].model.id).toBe("hatch");
    const suv = r.find((x) => x.model.id === "small-suv")!;
    expect(suv.reasons).toContainEqual({
      text: "Nu e hatchback; poate fi mai greu de parcat",
      positive: false,
    });
  });

  it("a well-priced SUV can outrank an over-budget hatchback in the city", () => {
    const models = [
      car({
        id: "hatch",
        price_eur: { min: 60000, max: 70000, set_on: "2026-01-01" },
      }),
      car({ id: "suv", body: "suv" }),
    ];
    expect(rank(models, prefs, DEFAULT_ASSUMPTIONS)[0].model.id).toBe("suv");
  });

  it("family usage keeps a small-trunk hatchback (lower score, not removed)", () => {
    const r = rank(
      [car({ body: "hatchback", trunk_l: 250 })],
      { ...prefs, usage: "familie" },
      DEFAULT_ASSUMPTIONS,
    );
    expect(r).toHaveLength(1);
  });
});

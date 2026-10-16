import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/config/scenarios";
import { scenarioResults, SCENARIO_TOP } from "@/lib/scenarios";
import { prefsFromQuery, prefsToQuery } from "@/lib/validation";
import type { CarModel } from "@/lib/types";
import { car, engine, price } from "./fixtures";

const l = (value: number) => ({
  value,
  unit: "l/100km" as const,
  cycle: "NEDC" as const,
});

/** Fixed catalog so the expected rankings below never drift with real data. */
const catalog: CarModel[] = [
  car({
    id: "city-hatch",
    body: "hatchback",
    trunk_l: 300,
    price_eur: price(5000, 7000),
    engines: [engine({ hp: 75, consumption: l(5) })],
  }),
  car({
    id: "family-wagon",
    body: "break",
    trunk_l: 550,
    price_eur: price(9000, 14000),
    engines: [
      engine({ energy: "motorina", cc: 1600, hp: 110, consumption: l(4.5) }),
    ],
  }),
  car({
    id: "family-suv",
    body: "suv",
    trunk_l: 450,
    price_eur: price(10000, 16000),
    engines: [engine({ hp: 115, consumption: l(7) })],
  }),
  car({
    id: "diesel-sedan",
    body: "sedan",
    trunk_l: 480,
    price_eur: price(12000, 18000),
    engines: [
      engine({ energy: "motorina", cc: 2000, hp: 140, consumption: l(5) }),
    ],
  }),
  car({
    id: "example-cheap",
    is_demo: true,
    price_eur: price(4000, 6000),
    engines: [engine({ consumption: l(4) })],
  }),
];

const pick = (id: string) =>
  scenarioResults(catalog).find((s) => s.id === id)!.results;

catalog.push(
  car({
    id: "unverified-cheap",
    verified: false,
    price_eur: price(4000, 6000),
    engines: [engine({ consumption: l(4) })],
  }),
);

describe("example scenarios", () => {
  it("have valid, shareable criteria", () => {
    for (const s of SCENARIOS)
      expect(prefsFromQuery(prefsToQuery(s.prefs)).prefs).toEqual(s.prefs);
  });

  it(`show at most ${SCENARIO_TOP} results and never example or unverified models`, () => {
    for (const s of scenarioResults(catalog)) {
      expect(s.results.length).toBeLessThanOrEqual(SCENARIO_TOP);
      expect(s.results.map((r) => r.model.id)).not.toContain("example-cheap");
      expect(s.results.map((r) => r.model.id)).not.toContain(
        "unverified-cheap",
      );
    }
  });

  it("city, petrol: the cheap hatchback wins", () => {
    expect(pick("oras-benzina").map((r) => [r.model.id, r.score])).toEqual([
      ["city-hatch", 100],
      ["family-suv", 9],
    ]);
  });

  it("family, any fuel: the wagon wins", () => {
    expect(pick("familie").map((r) => [r.model.id, r.score])).toEqual([
      ["family-wagon", 100],
      ["diesel-sedan", 77],
      ["family-suv", 67],
    ]);
  });

  it("highway, diesel: only diesel models", () => {
    expect(
      pick("autostrada-motorina").map((r) => [r.model.id, r.score]),
    ).toEqual([
      ["family-wagon", 96],
      ["diesel-sedan", 70],
    ]);
  });

  it("are empty when no real model is published", () => {
    for (const s of scenarioResults(
      catalog.filter((m) => m.is_demo || m.verified === false),
    ))
      expect(s.results).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASSUMPTIONS,
  monthlyCost,
  unsetNote,
  type CostAssumptions,
} from "@/lib/cost";
import { engine } from "./fixtures";

const a: CostAssumptions = {
  fuelPrice: { benzina: 8, motorina: 7, gpl: 4 },
  insuranceYear: 1200,
  roadTaxYear: 240,
  maintenanceYear: 1800,
};

describe("monthlyCost", () => {
  it("computes each component", () => {
    // 12 000 km/yr → 1 000 km/month × 6 l/100 km × 8 lei = 480
    const c = monthlyCost(engine(), 12000, a);
    expect(c.fuel).toBeCloseTo(480);
    expect(c.insurance).toBe(100);
    expect(c.tax).toBe(20);
    expect(c.maintenance).toBe(150);
    expect(c.total).toBeCloseTo(750);
  });

  it("uses the price for the engine energy", () => {
    const c = monthlyCost(
      engine({
        energy: "gpl",
        consumption: { value: 10, unit: "l/100km", cycle: "NEDC" },
      }),
      12000,
      a,
    );
    expect(c.fuel).toBeCloseTo(400);
  });

  it("0 km means only fixed costs", () => {
    expect(monthlyCost(engine(), 0, a).fuel).toBe(0);
  });

  it("all-zero assumptions give zero cost", () => {
    const zero = {
      fuelPrice: { benzina: 0, motorina: 0, gpl: 0 },
      insuranceYear: 0,
      roadTaxYear: 0,
      maintenanceYear: 0,
    };
    expect(monthlyCost(engine(), 20000, zero).total).toBe(0);
  });

  it.each([
    ["negative km", -1, a],
    ["NaN km", NaN, a],
    ["Infinity km", Infinity, a],
    ["negative insurance", 1000, { ...a, insuranceYear: -5 }],
    [
      "negative fuel price",
      1000,
      { ...a, fuelPrice: { ...a.fuelPrice, benzina: -1 } },
    ],
  ])("rejects %s", (_, km, as) => {
    expect(() =>
      monthlyCost(engine(), km as number, as as CostAssumptions),
    ).toThrow(RangeError);
  });

  it("rejects energies not enabled in V1", () => {
    expect(() => monthlyCost(engine({ energy: "electric" }), 1000, a)).toThrow(
      RangeError,
    );
  });

  it("defaults are valid", () => {
    expect(
      monthlyCost(engine(), 15000, DEFAULT_ASSUMPTIONS).total,
    ).toBeGreaterThan(0);
  });
});

describe("unset fixed costs", () => {
  it("count as 0 and are reported", () => {
    const c = monthlyCost(engine(), 12000, {
      ...a,
      insuranceYear: null,
      maintenanceYear: null,
    });
    expect(c.insurance).toBe(0);
    expect(c.unset).toEqual(["insuranceYear", "maintenanceYear"]);
    expect(unsetNote(c)).toBe("RCA, întreținere necompletate (calculat cu 0)");
  });

  it("defaults have no invented fixed costs", () => {
    expect([
      DEFAULT_ASSUMPTIONS.insuranceYear,
      DEFAULT_ASSUMPTIONS.roadTaxYear,
      DEFAULT_ASSUMPTIONS.maintenanceYear,
    ]).toEqual([null, null, null]);
  });
});

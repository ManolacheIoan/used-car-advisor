import { describe, expect, it } from "vitest";
import { computeTco, type TcoInput } from "@/lib/tco";

const base: TcoInput = {
  kmYear: 12000,
  consumptionL100: 6,
  fuelPrice: 10,
  rcaYear: 1000,
  roadTaxYear: 200,
  itpPerInspection: 200,
  itpIntervalYears: 2,
  vignetteYear: 250,
  maintenanceYear: 1500,
  purchasePriceEur: 10000,
  depreciationPctYear: 10,
  eurRon: 5,
  years: 5,
};

describe("computeTco", () => {
  it("computes each category per year", () => {
    const r = computeTco(base);
    const { depreciation, ...rest } = r.perYear[0];
    expect(rest).toEqual({
      fuel: 7200, // 12000 × 6/100 × 10
      rca: 1000,
      tax: 200,
      itp: 100, // 200 / 2 years
      vignette: 250,
      maintenance: 1500,
    });
    expect(depreciation).toBeCloseTo(5000); // 10000 € × 10 % × 5 lei
    expect(r.perYear[1].depreciation).toBeCloseTo(4500); // 10000 × (0.9 − 0.81) × 5
    expect(r.unset).toEqual([]);
  });

  it("totals: per year, per category, overall and monthly average", () => {
    const r = computeTco({ ...base, depreciationPctYear: 0 });
    expect(r.yearTotals[0]).toBe(10250);
    expect(r.categoryTotals.fuel).toBe(36000);
    expect(r.total).toBe(51250);
    expect(r.monthlyAverage).toBeCloseTo(51250 / 60);
  });

  it("depreciation over 5 years equals the value lost", () => {
    const r = computeTco(base);
    expect(r.categoryTotals.depreciation).toBeCloseTo(
      10000 * (1 - 0.9 ** 5) * 5,
    );
  });

  it("unset inputs count as 0 and are listed", () => {
    const r = computeTco({
      ...base,
      rcaYear: null,
      itpIntervalYears: null,
      eurRon: null,
      vignetteYear: null,
    });
    expect(r.perYear[0].rca).toBe(0);
    expect(r.unset.sort()).toEqual(["depreciation", "itp", "rca", "vignette"]);
  });

  it("rejects invalid input", () => {
    expect(() => computeTco({ ...base, kmYear: -1 })).toThrow(RangeError);
    expect(() => computeTco({ ...base, years: 0 })).toThrow(RangeError);
    expect(() => computeTco({ ...base, depreciationPctYear: 120 })).toThrow(
      RangeError,
    );
  });
});

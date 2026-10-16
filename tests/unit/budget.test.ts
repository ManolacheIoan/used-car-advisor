import { describe, expect, it } from "vitest";
import { modelsWithinBudget } from "@/lib/budget";
import type { CostAssumptions } from "@/lib/cost";
import { car, engine } from "./fixtures";

const a: CostAssumptions = {
  fuelPrice: { benzina: 10, motorina: 10, gpl: 5 },
  insuranceYear: 1200,
  roadTaxYear: null,
  maintenanceYear: null,
};
const l = (value: number) => ({
  value,
  unit: "l/100km" as const,
  cycle: "NEDC" as const,
});
const ms = [
  car({ id: "eco", engines: [engine({ consumption: l(5) })] }), // 12000 km → 500 fuel + 100 RCA = 600 / month
  car({ id: "thirsty", engines: [engine({ consumption: l(10) })] }), // 1000 + 100 = 1100
];

describe("modelsWithinBudget", () => {
  it("keeps models whose monthly running cost fits, cheapest first, with what is left", () => {
    const r = modelsWithinBudget(ms, 700, 12000, a);
    expect(r.map((x) => x.m.id)).toEqual(["eco"]);
    expect(r[0].left).toBeCloseTo(100);
    expect(modelsWithinBudget(ms, 2000, 12000, a).map((x) => x.m.id)).toEqual([
      "eco",
      "thirsty",
    ]);
  });
  it("rejects a negative budget", () => {
    expect(() => modelsWithinBudget(ms, -1, 12000, a)).toThrow(RangeError);
  });
});

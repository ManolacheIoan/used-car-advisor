import { FUEL_PRICES } from "@/config/fuelPrices";
import type { Engine } from "./types";

/** Shown next to every monthly cost figure. */
export const COST_NOTE =
  "orientativ, de obicei mai mare decât consumul declarat";

/** Editable assumptions. All values in RON. Defaults are approximate placeholders. */
export interface CostAssumptions {
  fuelPrice: { benzina: number; motorina: number; gpl: number }; // RON / litre
  insuranceYear: number; // RCA, RON / year
  roadTaxYear: number; // impozit auto, RON / year
  maintenanceYear: number; // revizii + uzură, RON / year
}

export const DEFAULT_ASSUMPTIONS: CostAssumptions = {
  fuelPrice: { ...FUEL_PRICES.prices },
  insuranceYear: 1200,
  roadTaxYear: 300,
  maintenanceYear: 2000,
};

export interface MonthlyCost {
  fuel: number;
  insurance: number;
  tax: number;
  maintenance: number;
  total: number;
}

function assertAmount(name: string, v: number) {
  if (!Number.isFinite(v) || v < 0)
    throw new RangeError(`${name} must be a finite number >= 0`);
}

export function fuelPriceFor(engine: Engine, a: CostAssumptions): number {
  if (
    engine.energy === "benzina" ||
    engine.energy === "motorina" ||
    engine.energy === "gpl"
  )
    return a.fuelPrice[engine.energy];
  throw new RangeError(`energy ${engine.energy} not supported in V1`);
}

/**
 * monthly = km/12 × consumption/100 × fuel price + (insurance + tax + maintenance)/12
 * Uses declared combined consumption, so real-world cost is usually higher.
 */
export function monthlyCost(
  engine: Engine,
  kmYear: number,
  a: CostAssumptions,
): MonthlyCost {
  assertAmount("kmYear", kmYear);
  assertAmount("insuranceYear", a.insuranceYear);
  assertAmount("roadTaxYear", a.roadTaxYear);
  assertAmount("maintenanceYear", a.maintenanceYear);
  const price = fuelPriceFor(engine, a);
  assertAmount("fuelPrice", price);

  const fuel = (kmYear / 12) * (engine.consumption.value / 100) * price;
  const insurance = a.insuranceYear / 12;
  const tax = a.roadTaxYear / 12;
  const maintenance = a.maintenanceYear / 12;
  return {
    fuel,
    insurance,
    tax,
    maintenance,
    total: fuel + insurance + tax + maintenance,
  };
}

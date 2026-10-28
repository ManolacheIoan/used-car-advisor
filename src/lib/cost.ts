import { COST_DEFAULTS } from "@/config/costDefaults";
import { FUEL_PRICES } from "@/config/fuelPrices";
import type { Engine } from "./types";

/** Shown next to every monthly cost figure. */
export const COST_NOTE =
  "orientativ, de obicei mai mare decât consumul declarat";

/**
 * Editable assumptions, in RON. Fuel prices come from the dated, sourced config. Fixed costs have no default
 * unless an official source exists (see src/config/costDefaults.ts); null = "necompletat", counted as 0 and listed.
 */
export interface CostAssumptions {
  fuelPrice: { benzina: number; motorina: number; gpl: number }; // RON / litre
  insuranceYear: number | null; // RCA, RON / year
  roadTaxYear: number | null; // impozit auto, RON / year
  maintenanceYear: number | null; // servicing + wear, RON / year
}

export const DEFAULT_ASSUMPTIONS: CostAssumptions = {
  fuelPrice: { ...FUEL_PRICES.prices },
  insuranceYear: COST_DEFAULTS.rcaYear.value,
  roadTaxYear: COST_DEFAULTS.roadTaxYear.value,
  maintenanceYear: COST_DEFAULTS.maintenanceYear.value,
};

export const FIXED_COST_LABEL = {
  insuranceYear: "RCA",
  roadTaxYear: "impozit",
  maintenanceYear: "întreținere",
} as const;

export interface MonthlyCost {
  fuel: number;
  insurance: number;
  tax: number;
  maintenance: number;
  total: number;
  /** Fixed costs the user has not filled in (counted as 0). */
  unset: (keyof typeof FIXED_COST_LABEL)[];
}

function assertAmount(name: string, v: number | null) {
  if (v === null) return;
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
 * Uses declared consumption, so real-world cost is usually higher. Unset fixed costs count as 0 and are reported.
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
  const insurance = (a.insuranceYear ?? 0) / 12;
  const tax = (a.roadTaxYear ?? 0) / 12;
  const maintenance = (a.maintenanceYear ?? 0) / 12;
  const unset = (
    Object.keys(FIXED_COST_LABEL) as (keyof typeof FIXED_COST_LABEL)[]
  ).filter((k) => a[k] === null);
  return {
    fuel,
    insurance,
    tax,
    maintenance,
    total: fuel + insurance + tax + maintenance,
    unset,
  };
}

/** "RCA, impozit necompletate" or "" */
export function unsetNote(c: MonthlyCost): string {
  if (!c.unset.length) return "";
  const names = c.unset.map((k) => FIXED_COST_LABEL[k]).join(", ");
  return `${names} ${c.unset.length === 1 ? "necompletat" : "necompletate"} (calculat cu 0)`;
}

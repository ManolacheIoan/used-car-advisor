import { describe, expect, it } from "vitest";
import { FUEL_PRICES, FUEL_PRICES_MAX_AGE_DAYS } from "@/config/fuelPrices";
import { DEFAULT_ASSUMPTIONS } from "@/lib/cost";

describe("fuel prices config", () => {
  it(`was updated in the last ${FUEL_PRICES_MAX_AGE_DAYS} days`, () => {
    const ageDays = (Date.now() - Date.parse(FUEL_PRICES.updated)) / 86_400_000;
    expect(
      ageDays,
      `FUEL_PRICES.updated is ${FUEL_PRICES.updated}; refresh src/config/fuelPrices.ts`,
    ).toBeLessThanOrEqual(FUEL_PRICES_MAX_AGE_DAYS);
    expect(ageDays).toBeGreaterThanOrEqual(-1); // not in the future
  });

  it("feeds the default cost assumptions", () => {
    expect(DEFAULT_ASSUMPTIONS.fuelPrice).toEqual(FUEL_PRICES.prices);
  });
});

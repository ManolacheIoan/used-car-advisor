import { describe, expect, it } from "vitest";
import { FUEL_PRICES, fuelPricesAgeDays } from "@/config/fuelPrices";
import { DEFAULT_ASSUMPTIONS } from "@/lib/cost";

describe("fuel prices config", () => {
  it("is not dated in the future and has a source", () => {
    expect(fuelPricesAgeDays(FUEL_PRICES.updated)).toBeGreaterThanOrEqual(0);
    expect(FUEL_PRICES.source.url).toMatch(/^https:\/\//);
  });

  it("computes age in whole days", () => {
    expect(
      fuelPricesAgeDays("2026-10-09", Date.parse("2026-12-08T12:00:00Z")),
    ).toBe(60);
    expect(
      fuelPricesAgeDays("2026-10-09", Date.parse("2026-12-09T12:00:00Z")),
    ).toBe(61);
  });

  it("feeds the default cost assumptions", () => {
    expect(DEFAULT_ASSUMPTIONS.fuelPrice).toEqual(FUEL_PRICES.prices);
  });
});

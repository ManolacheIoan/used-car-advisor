/**
 * Default fuel prices (RON / litre) used in the monthly cost estimate. Users can override them on the page.
 * National averages observed on `updated`. Update prices, date and source together.
 * CI prints a warning (it does not fail) when `updated` is older than FUEL_PRICES_MAX_AGE_DAYS.
 */
export const FUEL_PRICES = {
  updated: "2026-10-09",
  prices: { benzina: 10.15, motorina: 10.9, gpl: 4.71 },
  source: {
    title: "pretcarburant.ro (prin Ziarul Profit, 9 octombrie 2026)",
    url: "https://www.pretcarburant.ro/",
  },
} as const;

export const FUEL_PRICES_MAX_AGE_DAYS = 60;

/** Whole days between `updated` and `now`. */
export function fuelPricesAgeDays(updated: string, now = Date.now()): number {
  return Math.floor((now - Date.parse(updated)) / 86_400_000);
}

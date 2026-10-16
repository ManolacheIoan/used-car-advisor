/**
 * Default fuel prices (RON / litre) used in the monthly cost estimate. Users can override them on the page.
 * Update `updated` together with the prices; a unit test fails when it is older than MAX_AGE_DAYS.
 * Placeholder values — replace with current national averages from a public source.
 */
export const FUEL_PRICES = {
  updated: "2026-10-16",
  prices: { benzina: 7.5, motorina: 7.6, gpl: 3.8 },
} as const;

export const FUEL_PRICES_MAX_AGE_DAYS = 60;

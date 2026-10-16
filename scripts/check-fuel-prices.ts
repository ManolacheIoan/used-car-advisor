/** CI step: warns (GitHub annotation) when default fuel prices are stale. Never fails the build. */
import {
  FUEL_PRICES,
  FUEL_PRICES_MAX_AGE_DAYS,
  fuelPricesAgeDays,
} from "../src/config/fuelPrices.ts";

const age = fuelPricesAgeDays(FUEL_PRICES.updated);
if (age > FUEL_PRICES_MAX_AGE_DAYS) {
  console.log(
    `::warning file=src/config/fuelPrices.ts,title=Fuel prices are stale::Updated ${FUEL_PRICES.updated} (${age} days ago, limit ${FUEL_PRICES_MAX_AGE_DAYS}). Refresh prices, date and source.`,
  );
} else {
  console.log(
    `Fuel prices updated ${FUEL_PRICES.updated} (${age} days ago). OK.`,
  );
}

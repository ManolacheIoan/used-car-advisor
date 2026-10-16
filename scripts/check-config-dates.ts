/** CI step: warns (GitHub annotations) when dated configs are stale. Never fails the build. */
import {
  EXCHANGE_RATE,
  EXCHANGE_RATE_MAX_AGE_DAYS,
} from "../src/config/exchangeRate.ts";
import {
  FUEL_PRICES,
  FUEL_PRICES_MAX_AGE_DAYS,
  fuelPricesAgeDays,
} from "../src/config/fuelPrices.ts";

function check(name: string, file: string, date: string | null, max: number) {
  if (!date)
    return console.log(
      `::warning file=${file},title=${name} has no date::Set the value, its date and source.`,
    );
  const age = fuelPricesAgeDays(date);
  if (age > max)
    console.log(
      `::warning file=${file},title=${name} is stale::Updated ${date} (${age} days ago, limit ${max}).`,
    );
  else console.log(`${name} updated ${date} (${age} days ago). OK.`);
}

check(
  "Fuel prices",
  "src/config/fuelPrices.ts",
  FUEL_PRICES.updated,
  FUEL_PRICES_MAX_AGE_DAYS,
);
check(
  "EUR/RON rate",
  "src/config/exchangeRate.ts",
  EXCHANGE_RATE.date,
  EXCHANGE_RATE_MAX_AGE_DAYS,
);

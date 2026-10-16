/** Sources and licences of everything shown in this build, generated from the data and configs. */
import { EXCHANGE_RATE } from "@/config/exchangeRate";
import { FUEL_PRICES } from "@/config/fuelPrices";
import type { CarModel } from "./types";

export interface Attribution {
  title: string;
  url: string;
  retrieved_on: string;
  license: string;
  usedFor: string;
  models: number;
}

export function collectAttributions(models: CarModel[]): Attribution[] {
  const map = new Map<string, Attribution>();
  const add = (a: Omit<Attribution, "models">, count = 1) => {
    const prev = map.get(a.url + a.license);
    if (prev) {
      prev.models += count;
      if (a.retrieved_on > prev.retrieved_on)
        prev.retrieved_on = a.retrieved_on;
    } else map.set(a.url + a.license, { ...a, models: count });
  };
  for (const m of models) {
    for (const s of m.sources)
      add({
        title: s.source_title,
        url: s.source_url,
        retrieved_on: s.retrieved_on,
        license: s.license,
        usedFor: "date despre modele",
      });
    if (m.price_eur)
      add({
        title: m.price_eur.source_title,
        url: m.price_eur.source_url,
        retrieved_on: m.price_eur.retrieved_on,
        license: m.price_eur.license,
        usedFor: "prețuri",
      });
  }
  add(
    {
      title: FUEL_PRICES.source.title,
      url: FUEL_PRICES.source.url,
      retrieved_on: FUEL_PRICES.updated,
      license: "date publice (medii de preț)",
      usedFor: "prețuri carburant",
    },
    0,
  );
  if (EXCHANGE_RATE.source && EXCHANGE_RATE.date)
    add(
      {
        title: EXCHANGE_RATE.source.title,
        url: EXCHANGE_RATE.source.url,
        retrieved_on: EXCHANGE_RATE.date,
        license: "date publice (curs de referință)",
        usedFor: "curs EUR/RON",
      },
      0,
    );
  return [...map.values()].sort(
    (a, b) =>
      a.license.localeCompare(b.license) ||
      a.title.localeCompare(b.title, "ro"),
  );
}

export const needsShareAlike = (a: Attribution[]) =>
  a.some((x) => /BY-SA/i.test(x.license));

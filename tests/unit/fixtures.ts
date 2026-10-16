import type { CarModel, Engine, Price } from "@/lib/types";

export const engine = (over: Partial<Engine> = {}): Engine => ({
  energy: "benzina",
  cc: 1400,
  hp: 100,
  consumption: { value: 6, unit: "l/100km", cycle: "NEDC" },
  ...over,
});

/** A verified manual asking-price range with full provenance. */
export const price = (
  low: number,
  high: number,
  over: Partial<Price> = {},
): Price => ({
  low,
  high,
  n_listings: 12,
  collected_on: "2026-10-01",
  kind: "asking_price",
  source_title: "Prețuri culese manual",
  source_url: "https://example.com/preturi",
  retrieved_on: "2026-10-01",
  license: "date culese manual (fapte)",
  verified: true,
  is_demo: false,
  ...over,
});

export const car = (over: Partial<CarModel> = {}): CarModel => ({
  id: "t",
  verified: true,
  is_demo: false,
  brand: "Test",
  model: "T",
  generation: "I",
  years: { from: 2015, to: 2020 },
  body: "hatchback",
  engines: [engine()],
  seats: 5,
  trunk_l: 350,
  price_eur: price(30000, 40000),
  sources: [
    {
      source_title: "s",
      source_url: "https://example.com",
      retrieved_on: "2026-01-01",
      license: "CC0 1.0",
    },
  ],
  ...over,
});

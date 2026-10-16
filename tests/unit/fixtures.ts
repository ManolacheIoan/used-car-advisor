import type { CarModel, Engine } from "@/lib/types";

export const engine = (over: Partial<Engine> = {}): Engine => ({
  energy: "benzina",
  cc: 1400,
  hp: 100,
  consumption: { value: 6, unit: "l/100km", cycle: "NEDC" },
  ...over,
});

export const car = (over: Partial<CarModel> = {}): CarModel => ({
  id: "t",
  brand: "Test",
  model: "T",
  generation: "I",
  years: { from: 2015, to: 2020 },
  body: "hatchback",
  engines: [engine()],
  seats: 5,
  trunk_l: 350,
  price_eur: {
    low: 30000,
    high: 40000,
    n_listings: 12,
    collected_on: "2026-01-01",
    kind: "asking_price",
  },
  sources: [{ title: "s", url: "https://example.com", accessed: "2026-01-01" }],
  ...over,
});

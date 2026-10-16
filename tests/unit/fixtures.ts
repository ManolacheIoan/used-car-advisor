import type { CarModel, Engine } from "@/lib/types";

export const engine = (over: Partial<Engine> = {}): Engine => ({
  energy: "benzina",
  cc: 1400,
  hp: 100,
  consumption: { value: 6, unit: "l/100km" },
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
  price_ron: { min: 30000, max: 40000, set_on: "2026-01-01" },
  sources: [{ title: "s", url: "https://example.com", accessed: "2026-01-01" }],
  ...over,
});

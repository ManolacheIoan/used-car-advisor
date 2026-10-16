/**
 * DEMO catalog generator. Identity (brand, model, generation, years, body) comes from a sourced list;
 * every spec and price is SYNTHETIC, produced by the deterministic formula below with a fixed seed.
 * Nothing is derived from listings or scraped data. Documented in docs/DEMO_DATA.md.
 */
import type { Body, CarModel, Catalog, Energy, Engine, Source } from "./types";

export const DEMO_SEED = 20261016;
export const DEMO_REF_YEAR = 2026;
export const DEMO_SOURCE_URL =
  "https://github.com/ManolacheIoan/alegemasina/blob/main/docs/DEMO_DATA.md";

/** One entry of data/demo-models.json: identity only, with its source. */
export interface DemoIdentity {
  id: string;
  brand: string;
  model: string;
  generation: string;
  years: { from: number; to: number };
  body: Body;
  source: Source;
}

/** Segment = body type. Base price (EUR) of a new car of that segment, purely synthetic. */
export const SEGMENT_BASE_EUR: Record<Body, number> = {
  hatchback: 18000,
  sedan: 26000,
  break: 27000,
  suv: 28000,
  mpv: 24000,
};
/** Yearly residual value factor (age = reference year − middle production year). */
export const RESIDUAL_PER_YEAR = 0.88;
/** Fuel factor applied to the price (mean over the synthetic engines). */
export const FUEL_FACTOR: Record<"benzina" | "motorina" | "gpl", number> = {
  benzina: 1,
  motorina: 1.08,
  gpl: 0.95,
};

const PETROL_L100: Record<Body, number> = {
  hatchback: 5.8,
  sedan: 6.3,
  break: 6.5,
  suv: 7.2,
  mpv: 7,
};
const SEATS: Record<Body, number> = {
  hatchback: 5,
  sedan: 5,
  break: 5,
  suv: 5,
  mpv: 7,
};
const TRUNK_L: Record<Body, number> = {
  hatchback: 340,
  sedan: 480,
  break: 560,
  suv: 450,
  mpv: 620,
};

/** Deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash of the id, so each model gets its own reproducible random stream. */
export function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++)
    h = Math.imul(h ^ id.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const r100 = (n: number) => Math.max(500, Math.round(n / 100) * 100);

export function demoEngines(m: DemoIdentity, rand: () => number): Engine[] {
  const cycle = m.years.to >= 2019 ? "WLTP" : "NEDC";
  const petrol = PETROL_L100[m.body];
  const big = m.body === "suv" ? 20 : 0;
  const e = (
    energy: Energy,
    cc: number,
    hp: number,
    value: number,
  ): Engine => ({
    energy,
    cc,
    hp,
    consumption: { value: r1(value), unit: "l/100km", cycle },
  });
  const engines = [
    e("benzina", 1400, 100 + big, petrol),
    e("motorina", 1600, 110 + big, petrol - 1.4),
  ];
  if (rand() < 0.25) engines.push(e("gpl", 1400, 95 + big, petrol * 1.25));
  return engines;
}

/** price = base(segment) × 0.88^age × mean fuel factor × noise(0.9–1.1); range ±15 %, rounded to 100 €. */
export function demoPrice(
  m: DemoIdentity,
  engines: Engine[],
  rand: () => number,
) {
  const age = Math.max(
    0,
    DEMO_REF_YEAR - Math.round((m.years.from + m.years.to) / 2),
  );
  const fuel =
    engines.reduce(
      (s, x) => s + FUEL_FACTOR[x.energy as keyof typeof FUEL_FACTOR],
      0,
    ) / engines.length;
  const mid =
    SEGMENT_BASE_EUR[m.body] *
    RESIDUAL_PER_YEAR ** age *
    fuel *
    (0.9 + 0.2 * rand());
  return { low: r100(mid * 0.85), high: r100(mid * 1.15) };
}

export function buildDemoCatalog(
  identities: DemoIdentity[],
  generatedOn: string,
): Catalog {
  const synthetic: Source = {
    source_title:
      "Valori sintetice DEMO (formulă deterministă, docs/DEMO_DATA.md)",
    source_url: DEMO_SOURCE_URL,
    retrieved_on: generatedOn,
    license: "synthetic",
  };
  const models: CarModel[] = identities.map((m) => {
    const rand = mulberry32(DEMO_SEED ^ hashId(m.id));
    const engines = demoEngines(m, rand);
    const { low, high } = demoPrice(m, engines, rand);
    return {
      id: m.id,
      verified: false,
      is_demo: true,
      brand: m.brand,
      model: m.model,
      generation: m.generation,
      years: m.years,
      body: m.body,
      engines,
      seats: SEATS[m.body],
      trunk_l: TRUNK_L[m.body],
      price_eur: {
        low,
        high,
        n_listings: null,
        collected_on: generatedOn,
        kind: "synthetic",
        notes: "preț sintetic DEMO, nu provine din anunțuri",
        source_title: synthetic.source_title,
        source_url: synthetic.source_url,
        retrieved_on: generatedOn,
        license: synthetic.license,
        verified: false,
        is_demo: true,
      },
      sources: [m.source, synthetic],
      pros: [],
      cons: [],
      known_issues: [],
    };
  });
  return { updated: generatedOn, models };
}

export type Energy = "benzina" | "motorina" | "gpl" | "hibrid" | "electric";
/** Homologation test cycle of a declared consumption figure. */
export type TestCycle = "NEDC" | "WLTP" | "unknown";

export type Usage = "oras" | "autostrada" | "familie" | "mixt";
export type Body = "hatchback" | "sedan" | "break" | "suv" | "mpv";

/** Provenance of a group of facts. `license` e.g. "CC0 1.0", "CC BY-SA 4.0", "manufacturer facts", "synthetic". */
export interface Source {
  source_title: string;
  source_url: string;
  retrieved_on: string;
  license: string;
}

export interface Engine {
  energy: Energy;
  cc?: number;
  hp: number;
  /** Declared consumption as published; `cycle` is the test cycle. Never converted between cycles. */
  consumption: {
    value: number;
    unit: "l/100km" | "kWh/100km";
    cycle: TestCycle;
  };
}

export interface CarModel {
  id: string;
  /** Confirmed by the site owner against its sources. Only verified, non-demo rows may be public. */
  verified: boolean;
  /** Demo catalog row (synthetic values, local testing only). */
  is_demo: boolean;
  brand: string;
  model: string;
  generation: string;
  years: { from: number; to: number };
  body: Body;
  engines: Engine[];
  seats: number;
  trunk_l: number;
  /** Absent until a price is entered; models without a price are excluded from results. */
  price_eur?: Price;
  sources: Source[];
  // V2 fields: kept in data, not rendered in V1.
  pros?: unknown[];
  cons?: unknown[];
  known_issues?: unknown[];
}

/** Price range in EUR with its own provenance. Public: manual asking prices. Demo: synthetic formula. */
export interface Price {
  low: number;
  high: number;
  /** Listings the range is based on (≥ 10 for asking prices); null for synthetic demo prices. */
  n_listings: number | null;
  collected_on: string;
  kind: "asking_price" | "synthetic";
  notes?: string;
  source_title: string;
  source_url: string;
  retrieved_on: string;
  license: string;
  verified: boolean;
  is_demo: boolean;
}

export interface Catalog {
  updated: string;
  models: CarModel[];
}

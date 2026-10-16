export type Energy = "benzina" | "motorina" | "gpl" | "hibrid" | "electric";
export type Usage = "oras" | "autostrada" | "familie" | "mixt";
export type Body = "hatchback" | "sedan" | "break" | "suv" | "mpv";

export interface Source {
  title: string;
  url: string;
  accessed: string;
}

export interface Engine {
  energy: Energy;
  cc?: number;
  hp: number;
  consumption: { value: number; unit: "l/100km" | "kWh/100km" };
}

export interface CarModel {
  id: string;
  example?: boolean;
  brand: string;
  model: string;
  generation: string;
  years: { from: number; to: number };
  body: Body;
  engines: Engine[];
  seats: number;
  trunk_l: number;
  price_eur: { min: number; max: number; set_on: string };
  sources: Source[];
  // V2 fields: kept in data, not rendered in V1.
  pros?: unknown[];
  cons?: unknown[];
  known_issues?: unknown[];
}

export interface Catalog {
  updated: string;
  models: CarModel[];
}

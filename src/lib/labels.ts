import type { Body, CarModel, Energy, Usage } from "./types";

export const ENERGY_LABEL: Record<Energy, string> = {
  benzina: "Benzină",
  motorina: "Motorină",
  gpl: "GPL",
  hibrid: "Hibrid",
  electric: "Electric",
};

export const BODY_LABEL: Record<Body, string> = {
  hatchback: "Hatchback",
  sedan: "Sedan",
  break: "Break",
  suv: "SUV",
  mpv: "Monovolum",
};

export const USAGE_LABEL: Record<Usage, string> = {
  oras: "Oraș",
  autostrada: "Autostradă",
  familie: "Familie",
  mixt: "Mixt",
};

export const lei = (n: number) =>
  `${Math.round(n).toLocaleString("ro-RO")} lei`;

/** Purchase prices are in euro (how used cars are listed in Romania); running costs stay in lei. */
export const eur = (n: number) => `${Math.round(n).toLocaleString("ro-RO")} €`;

const num1 = (n: number) =>
  n.toLocaleString("ro-RO", { maximumFractionDigits: 1 });

/** "Generația VII · 2012–2021" */
export const generationLabel = (m: CarModel) =>
  `Generația ${m.generation} · ${m.years.from}–${m.years.to}`;

/** "benzină 1197 cm³ (85–105 CP), motorină 1598 cm³ (105–110 CP)": grouped by fuel and exact displacement. */
export function engineSummary(m: CarModel): string {
  const groups = new Map<string, number[]>();
  for (const e of m.engines) {
    const key = `${ENERGY_LABEL[e.energy].toLowerCase()}${e.cc ? ` ${e.cc} cm³` : ""}`;
    groups.set(key, [...(groups.get(key) ?? []), e.hp]);
  }
  return [...groups]
    .map(([k, hp]) => {
      const lo = Math.min(...hp);
      const hi = Math.max(...hp);
      return `${k} (${lo === hi ? lo : `${lo}–${hi}`} CP)`;
    })
    .join(", ");
}

/** "3,8–6,9 l/100 km" */
export function consumptionRange(m: CarModel): string {
  const v = m.engines.map((e) => e.consumption.value);
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  return `${lo === hi ? num1(lo) : `${num1(lo)}–${num1(hi)}`} l/100 km`;
}

export const NO_PRICE = "fără preț verificat";

/** "4.000 € – 6.000 €", or a clear placeholder when no verified price exists. */
export const priceRange = (m: CarModel) =>
  m.price_eur ? `${eur(m.price_eur.min)} – ${eur(m.price_eur.max)}` : NO_PRICE;

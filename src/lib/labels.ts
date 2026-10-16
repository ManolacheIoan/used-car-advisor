import type { Body, Energy, Usage } from "./types";

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

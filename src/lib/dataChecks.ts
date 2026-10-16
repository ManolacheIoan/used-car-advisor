import type { Catalog } from "./types";

/** Energy types offered in V1. Hybrid/electric are schema-ready but not used yet. */
export const V1_ENERGIES = ["benzina", "motorina", "gpl"] as const;

/** Checks the JSON schema cannot express. Returns one message per problem, prefixed by model id. */
export function semanticErrors(c: Catalog): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const m of c.models) {
    if (seen.has(m.id)) errs.push(`${m.id}: duplicate id`);
    seen.add(m.id);
    if (m.years.from > m.years.to) errs.push(`${m.id}: years.from > years.to`);
    if (m.price_ron.min > m.price_ron.max)
      errs.push(`${m.id}: price min > max`);
    for (const e of m.engines) {
      if (!(V1_ENERGIES as readonly string[]).includes(e.energy))
        errs.push(`${m.id}: energy ${e.energy} not enabled in V1`);
      const expected = e.energy === "electric" ? "kWh/100km" : "l/100km";
      if (e.consumption.unit !== expected)
        errs.push(`${m.id}: wrong unit for ${e.energy}`);
      if (e.energy !== "electric" && e.cc === undefined)
        errs.push(`${m.id}: missing cc`);
    }
  }
  return errs;
}

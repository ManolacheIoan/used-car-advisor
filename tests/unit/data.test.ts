import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "@/data/cars.schema.json";
import catalog from "@/data/cars.json";
import { V1_ENERGIES } from "@/lib/data";
import type { Catalog } from "@/lib/types";

function validate(data: unknown) {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const ok = ajv.validate(schema, data);
  return { ok, errors: ajv.errorsText(ajv.errors) };
}

/** Checks the schema cannot express. Returns a list of problems. */
function semanticErrors(c: Catalog): string[] {
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

const good = catalog as Catalog;
const clone = (): Catalog => structuredClone(good);

describe("cars.json", () => {
  it("matches the schema", () => {
    const r = validate(catalog);
    expect(r.errors).toBe("No errors");
    expect(r.ok).toBe(true);
  });

  it("passes semantic checks", () => {
    expect(semanticErrors(good)).toEqual([]);
  });
});

describe("validators reject bad data", () => {
  it("missing required field", () => {
    const c = clone();
    delete (c.models[0] as Partial<(typeof c.models)[0]>).trunk_l;
    expect(validate(c).ok).toBe(false);
  });

  it("missing sources", () => {
    const c = clone();
    c.models[0].sources = [];
    expect(validate(c).ok).toBe(false);
  });

  it("invalid source url", () => {
    const c = clone();
    c.models[0].sources[0].url = "not a url";
    expect(validate(c).ok).toBe(false);
  });

  it("V2 issue with a single source", () => {
    const c = clone();
    const s = c.models[0].sources[0];
    c.models[0].known_issues = [
      {
        text: "x",
        engines: ["1.2"],
        years: { from: 2015, to: 2016 },
        severity: "medie",
        sources: [s],
        date: "2026-10-16",
        confidence: "medie",
      },
    ];
    expect(validate(c).ok).toBe(false);
  });

  it("inverted ranges", () => {
    const c = clone();
    c.models[0].years = { from: 2020, to: 2010 };
    c.models[1].price_ron.min = c.models[1].price_ron.max + 1;
    expect(semanticErrors(c)).toHaveLength(2);
  });

  it("duplicate id", () => {
    const c = clone();
    c.models[1].id = c.models[0].id;
    expect(semanticErrors(c)).toContain(`${c.models[0].id}: duplicate id`);
  });

  it("energy not enabled in V1", () => {
    const c = clone();
    c.models[0].engines[0].energy = "electric";
    expect(semanticErrors(c).join()).toMatch(/not enabled in V1/);
  });
});

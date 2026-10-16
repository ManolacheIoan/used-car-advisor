import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "@/data/cars.schema.json";
import demoCatalog from "@/data/cars.demo.json";
import publicCatalog from "@/data/cars.public.json";
import { semanticErrors } from "@/lib/dataChecks";
import type { Catalog } from "@/lib/types";
import { price } from "./fixtures";

function validate(data: unknown) {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const ok = ajv.validate(schema, data);
  return { ok, errors: ajv.errorsText(ajv.errors) };
}

// Mutation tests below use the demo catalog because it always has rows.
const good = demoCatalog as Catalog;
const clone = (): Catalog => structuredClone(good);

describe.each([
  ["cars.public.json", publicCatalog as Catalog],
  ["cars.demo.json", demoCatalog as Catalog],
])("%s", (_, catalog) => {
  it("matches the schema", () => {
    const r = validate(catalog);
    expect(r.errors).toBe("No errors");
    expect(r.ok).toBe(true);
  });

  it("passes semantic checks", () => {
    expect(semanticErrors(catalog)).toEqual([]);
  });
});

describe("catalog separation", () => {
  it("public catalog has only verified, non-demo rows and prices", () => {
    for (const m of (publicCatalog as Catalog).models) {
      expect(m.verified && !m.is_demo).toBe(true);
      if (m.price_eur)
        expect(m.price_eur.verified && !m.price_eur.is_demo).toBe(true);
    }
  });

  it("demo catalog has only demo rows with synthetic prices", () => {
    for (const m of (demoCatalog as Catalog).models) {
      expect(m.is_demo && !m.verified).toBe(true);
      expect(m.price_eur?.kind).toBe("synthetic");
    }
  });
});

describe("validators reject bad data", () => {
  it("missing required field", () => {
    const c = clone();
    delete (c.models[0] as Partial<(typeof c.models)[0]>).trunk_l;
    expect(validate(c).ok).toBe(false);
  });

  it("missing license on a source", () => {
    const c = clone();
    delete (
      c.models[0].sources[0] as Partial<(typeof c.models)[0]["sources"][0]>
    ).license;
    expect(validate(c).ok).toBe(false);
  });

  it("missing sources", () => {
    const c = clone();
    c.models[0].sources = [];
    expect(validate(c).ok).toBe(false);
  });

  it("invalid source url", () => {
    const c = clone();
    c.models[0].sources[0].source_url = "not a url";
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
    c.models[1].price_eur = price(9000, 8000);
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

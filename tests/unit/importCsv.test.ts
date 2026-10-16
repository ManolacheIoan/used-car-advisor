import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLUMNS, csvToCatalog, parseCsv } from "@/lib/importCsv";

const header = COLUMNS.join(",");
const U = "https://example.com/a";
const D = "2026-10-01";
const base: Record<string, string> = {
  id: "m-1",
  brand: "B",
  model: "M",
  generation: "I",
  example: "",
  year_from: "2015",
  year_to: "2020",
  years_source: U,
  years_date: D,
  body: "hatchback",
  body_source: U,
  body_date: D,
  seats: "5",
  seats_source: U,
  seats_date: D,
  trunk_l: "300",
  trunk_source: U,
  trunk_date: D,
  energy: "benzina",
  cc: "1200",
  hp: "75",
  consumption_l100km: "5,5",
  engine_source: U,
  engine_date: D,
  price_min_ron: "20000",
  price_max_ron: "30000",
  price_source: "https://example.com/p",
  price_date: D,
};
const quote = (v: string) => (v.includes(",") ? `"${v}"` : v);
const row = (over: Record<string, string> = {}) =>
  COLUMNS.map((c) => quote({ ...base, ...over }[c])).join(",");
const csv = (...rows: string[]) => [header, ...rows].join("\n");
const run = (text: string) => csvToCatalog(text, { updated: "2026-10-16" });
const messages = (text: string) =>
  run(text).errors.map((e) => `${e.line}: ${e.message}`);

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas, CRLF and BOM", () => {
    expect(parseCsv('﻿a,"b, c","say ""hi"""\r\n1,2,3\r\n')).toEqual([
      ["a", "b, c", 'say "hi"'],
      ["1", "2", "3"],
    ]);
  });
  it("drops blank lines", () => {
    expect(parseCsv("a,b\n\n,\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("csvToCatalog", () => {
  it("builds a model with grouped engines, decimal comma and deduped sources", () => {
    const { catalog, errors } = run(
      csv(
        row(),
        row({
          brand: "",
          energy: "motorina",
          cc: "1500",
          hp: "90",
          consumption_l100km: "4.2",
        }),
      ),
    );
    expect(errors).toEqual([]);
    const m = catalog!.models[0];
    expect(m.engines.map((e) => e.consumption.value)).toEqual([5.5, 4.2]);
    expect(m.sources.map((s) => s.url)).toEqual([U, "https://example.com/p"]);
    expect(m.price_ron.set_on).toBe(D);
    expect(m.known_issues).toEqual([]);
  });

  it("keeps existing V2 fields from the previous catalog", () => {
    const issue = { text: "x" };
    const previous = {
      updated: D,
      models: [{ id: "m-1", known_issues: [issue] }],
    } as never;
    const { catalog } = csvToCatalog(csv(row()), { updated: D, previous });
    expect(catalog!.models[0].known_issues).toEqual([issue]);
  });

  it("reports missing columns", () => {
    expect(messages("id,brand\nx,y")[0]).toMatch(/^1: missing columns: model/);
  });

  it("reports missing fields and sources per line", () => {
    const m = messages(
      csv(row(), row({ id: "m-2", seats: "", price_source: "" })),
    );
    expect(m).toContain("3: missing seats");
    expect(m).toContain(
      "3: missing price_source (source for price_min_ron, price_max_ron)",
    );
  });

  it("reports invalid URLs and dates", () => {
    const m = messages(
      csv(row({ body_source: "www.x.ro", trunk_date: "16.10.2026" })),
    );
    expect(m).toContain("2: body_source is not a valid http(s) URL");
    expect(m).toContain('2: trunk_date must be YYYY-MM-DD, got "16.10.2026"');
  });

  it("reports invalid ranges", () => {
    const m = messages(csv(row({ year_from: "2021", price_min_ron: "40000" })));
    expect(m).toContain("2: year_from 2021 > year_to 2020");
    expect(m).toContain("2: price_min_ron 40000 > price_max_ron 30000");
  });

  it("reports duplicate ids and conflicting model columns", () => {
    const m = messages(
      csv(row(), row({ id: "m-2" }), row(), row({ id: "m-2", seats: "7" })),
    );
    expect(m).toContain("4: duplicate id (first used on line 2)");
    expect(m).toContain('5: seats "7" conflicts with line 3 ("5")');
  });

  it("rejects energies and values outside V1", () => {
    const m = messages(
      csv(row({ energy: "electric", hp: "abc", consumption_l100km: "0" })),
    );
    expect(m.some((x) => x.startsWith("2: energy must be one of"))).toBe(true);
    expect(m).toContain('2: hp must be a positive whole number, got "abc"');
    expect(m.some((x) => x.startsWith("2: consumption_l100km"))).toBe(true);
  });

  it("imports the template without errors", () => {
    const { catalog, errors } = run(
      readFileSync("data/cars.template.csv", "utf8"),
    );
    expect(errors).toEqual([]);
    expect(catalog!.models).toHaveLength(5);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLUMNS, csvToCatalog, formatReport, parseCsv } from "@/lib/importCsv";

const header = COLUMNS.join(",");
const U = "https://example.com/a";
const D = "2026-10-01";
const src = (g: string, url = U) => ({
  [`${g}_source_title`]: "Sursa A",
  [`${g}_source_url`]: url,
  [`${g}_date`]: D,
});
const base: Record<string, string> = {
  id: "m-1",
  brand: "B",
  model: "M",
  generation: "I",
  example: "",
  verification: "verified",
  year_from: "2015",
  year_to: "2020",
  ...src("years"),
  body: "hatchback",
  ...src("body"),
  seats: "5",
  ...src("seats"),
  trunk_l: "300",
  ...src("trunk"),
  energy: "benzina",
  cc: "1200",
  hp: "75",
  consumption_l100km: "5.5",
  consumption_cycle: "NEDC",
  ...src("engine"),
  price_min_eur: "4000",
  price_max_eur: "6000",
  ...src("price", "https://example.com/p"),
};
const quote = (v: string) => (v.includes(",") ? `"${v}"` : v);
const row = (over: Record<string, string> = {}) =>
  COLUMNS.map((c) => quote({ ...base, ...over }[c] ?? "")).join(",");
const csv = (...rows: string[]) => [header, ...rows].join("\n");
const run = (text: string) =>
  csvToCatalog([{ name: "t.csv", text }], { updated: "2026-10-16" });
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

describe("csvToCatalog: publishing", () => {
  it("publishes a complete, verified model with grouped engines and titled sources", () => {
    const r = run(
      csv(
        row({ consumption_l100km: "5,5" }),
        row({
          brand: "",
          energy: "motorina",
          cc: "1500",
          hp: "90",
          consumption_l100km: "4.2",
        }),
      ),
    );
    expect(r.errors).toEqual([]);
    const m = r.catalog!.models[0];
    expect(m.engines.map((e) => e.consumption.value)).toEqual([5.5, 4.2]);
    expect(m.sources).toEqual([
      { title: "Sursa A", url: U, accessed: D },
      { title: "Sursa A", url: "https://example.com/p", accessed: D },
    ]);
    expect(m.price_eur).toEqual({ min: 4000, max: 6000, set_on: D });
  });

  it("publishes complete models that need verification, flagged verified: false", () => {
    const r = run(csv(row({ verification: "needs verification" })));
    expect(r.errors).toEqual([]);
    expect(r.catalog!.models[0].verified).toBe(false);
    expect(r.unverified).toEqual(["m-1"]);
    expect(run(csv(row())).catalog!.models[0].verified).toBe(true);
  });

  it("publishes example models without verification", () => {
    const r = run(csv(row({ example: "true", verification: "" })));
    expect(r.catalog!.models[0].example).toBe(true);
  });

  it("keeps existing V2 fields from the previous catalog", () => {
    const issue = { text: "x" };
    const previous = {
      updated: D,
      models: [{ id: "m-1", known_issues: [issue] }],
    } as never;
    const r = csvToCatalog([{ name: "t.csv", text: csv(row()) }], {
      updated: D,
      previous,
    });
    expect(r.catalog!.models[0].known_issues).toEqual([issue]);
  });
});

describe("csvToCatalog: incomplete models are skipped and reported", () => {
  it("lists missing values and missing sources", () => {
    const r = run(
      csv(
        row({ price_min_eur: "", price_max_eur: "", price_source_url: "" }),
        row({ id: "m-2", seats: "4", seats_source_title: "" }),
      ),
    );
    expect(r.errors).toEqual([]);
    expect(r.catalog!.models).toEqual([]);
    expect(r.incomplete).toEqual([
      {
        id: "m-1",
        file: "t.csv",
        line: 2,
        missing: ["price_min_eur", "price_max_eur", "price_source_url"],
      },
      { id: "m-2", file: "t.csv", line: 3, missing: ["seats_source_title"] },
    ]);
  });

  it("publishes a model without any price, but lists it as unpriced", () => {
    const empty = {
      price_min_eur: "",
      price_max_eur: "",
      price_source_title: "",
      price_source_url: "",
      price_date: "",
    };
    const r = run(csv(row(empty)));
    expect(r.catalog!.models[0].price_eur).toBeUndefined();
    expect(r.unpriced).toEqual(["m-1"]);
    expect(formatReport(r, "2026-10-16")).toContain("Fără preț verificat");
  });

  it("names the line of an incomplete engine row", () => {
    const r = run(
      csv(row(), row({ brand: "", consumption_l100km: "", hp: "90" })),
    );
    expect(r.incomplete[0].missing).toEqual(["consumption_l100km (line 3)"]);
  });

  it("writes a readable report", () => {
    const r = run(csv(row({ price_min_eur: "" })));
    const md = formatReport(r, "2026-10-16");
    expect(md).toContain("Incomplete (nepublicate): 1");
    expect(md).toContain("`m-1` (t.csv:2): price_min_eur");
  });
});

describe("csvToCatalog: invalid values are errors", () => {
  it("reports missing columns", () => {
    expect(messages("id,brand\nx,y")[0]).toMatch(/^1: missing columns: model/);
  });

  it("reports invalid URLs and dates", () => {
    const m = messages(
      csv(row({ body_source_url: "www.x.ro", trunk_date: "16.10.2026" })),
    );
    expect(m).toContain("2: body_source_url is not a valid http(s) URL");
    expect(m).toContain('2: trunk_date must be YYYY-MM-DD, got "16.10.2026"');
  });

  it("reports invalid ranges", () => {
    const m = messages(csv(row({ year_from: "2021", price_min_eur: "9000" })));
    expect(m).toContain("2: year_from 2021 > year_to 2020");
    expect(m).toContain("2: price_min_eur 9000 > price_max_eur 6000");
  });

  it("reports duplicate ids, also across files, and conflicting model columns", () => {
    const m = messages(
      csv(row(), row({ id: "m-2" }), row(), row({ id: "m-2", seats: "7" })),
    );
    expect(m).toContain("4: duplicate id (first used on t.csv line 2)");
    expect(m).toContain('5: seats "7" conflicts with line 3 ("5")');
    const r = csvToCatalog(
      [
        { name: "a.csv", text: csv(row()) },
        { name: "b.csv", text: csv(row()) },
      ],
      { updated: D },
    );
    expect(r.errors[0].message).toBe(
      "duplicate id (first used on a.csv line 2)",
    );
  });

  it("rejects values outside V1 and unknown verification states", () => {
    const m = messages(
      csv(
        row({
          energy: "electric",
          hp: "abc",
          consumption_l100km: "0",
          verification: "ok",
        }),
      ),
    );
    expect(m.some((x) => x.startsWith("2: energy must be one of"))).toBe(true);
    expect(m).toContain('2: hp must be a positive whole number, got "abc"');
    expect(m.some((x) => x.startsWith("2: consumption_l100km"))).toBe(true);
    expect(m.some((x) => x.startsWith("2: verification must be"))).toBe(true);
    expect(messages(csv(row({ consumption_cycle: "EPA" })))).toContain(
      '2: consumption_cycle must be one of NEDC/WLTP/unknown, got "EPA"',
    );
  });
});

describe("repository data", () => {
  const files = ["data/cars.template.csv"].map((name) => ({
    name,
    text: readFileSync(name, "utf8"),
  }));
  const r = csvToCatalog(files, { updated: "2026-10-16" });

  it("imports without errors", () => {
    expect(r.errors).toEqual([]);
  });

  it("never publishes an incomplete model; unverified ones are flagged", () => {
    const byId = new Map(r.catalog!.models.map((m) => [m.id, m]));
    for (const m of r.incomplete) expect(byId.has(m.id)).toBe(false);
    for (const id of r.unverified) expect(byId.get(id)?.verified).toBe(false);
  });

  it("matches the committed cars.json", () => {
    const committed = JSON.parse(readFileSync("src/data/cars.json", "utf8"));
    expect(r.catalog!.models.map((m) => m.id)).toEqual(
      committed.models.map((m: { id: string }) => m.id),
    );
  });
});

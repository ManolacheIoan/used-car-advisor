import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLUMNS, csvToCatalog, formatReport, parseCsv } from "@/lib/importCsv";

const header = COLUMNS.join(",");
const U = "https://example.com/a";
const D = "2026-10-01";
const src = (g: string, license = "CC BY-SA 4.0") => ({
  [`${g}_source_title`]: "Sursa A",
  [`${g}_source_url`]: U,
  [`${g}_date`]: D,
  [`${g}_license`]: license,
});
const base: Record<string, string> = {
  id: "m-1",
  brand: "B",
  model: "M",
  generation: "I",
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
  price_low_eur: "4000",
  price_high_eur: "6000",
  n_listings: "12",
  collected_on: D,
  kind: "asking_price",
  notes: "",
  price_source_title: "Prețuri culese manual",
  price_source_url: "https://example.com/p",
  price_license: "date culese manual (fapte)",
  price_verification: "verified",
};
const NO_PRICE = {
  price_low_eur: "",
  price_high_eur: "",
  n_listings: "",
  collected_on: "",
  kind: "",
  notes: "",
  price_source_title: "",
  price_source_url: "",
  price_license: "",
  price_verification: "",
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

describe("public catalog", () => {
  it("contains a complete, verified model with licensed sources and a verified price", () => {
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
    expect(m.verified && !m.is_demo).toBe(true);
    expect(m.engines.map((e) => e.consumption.value)).toEqual([5.5, 4.2]);
    expect(m.sources).toEqual([
      {
        source_title: "Sursa A",
        source_url: U,
        retrieved_on: D,
        license: "CC BY-SA 4.0",
      },
    ]);
    expect(m.price_eur).toMatchObject({
      low: 4000,
      high: 6000,
      n_listings: 12,
      kind: "asking_price",
      source_url: "https://example.com/p",
      license: "date culese manual (fapte)",
      verified: true,
      is_demo: false,
    });
  });

  it("excludes complete models that need verification", () => {
    const r = run(csv(row({ verification: "needs verification" })));
    expect(r.catalog!.models).toEqual([]);
    expect(r.unverified).toEqual(["m-1"]);
  });

  it("drops a price that is not verified yet", () => {
    const r = run(csv(row({ price_verification: "needs verification" })));
    expect(r.catalog!.models[0].price_eur).toBeUndefined();
    expect(r.priceUnverified).toEqual(["m-1"]);
  });

  it("keeps a model without any price, listed as unpriced", () => {
    const r = run(csv(row(NO_PRICE)));
    expect(r.catalog!.models[0].price_eur).toBeUndefined();
    expect(r.unpriced).toEqual(["m-1"]);
    expect(formatReport(r, "2026-10-16")).toContain(
      "Publice fără preț verificat",
    );
  });

  it("keeps existing V2 fields from the previous catalog", () => {
    const issue = { text: "x" };
    const previous = {
      updated: D,
      models: [{ id: "m-1", known_issues: [issue] }],
    } as never;
    const r = csvToCatalog([{ name: "t.csv", text: csv(row()) }], {
      updated: "2026-10-16",
      previous,
    });
    expect(r.catalog!.models[0].known_issues).toEqual([issue]);
  });
});

describe("incomplete models are excluded and reported", () => {
  it("lists missing values and missing sources", () => {
    const r = run(
      csv(
        row({ price_low_eur: "", price_high_eur: "" }),
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
        missing: ["price_low_eur", "price_high_eur"],
      },
      { id: "m-2", file: "t.csv", line: 3, missing: ["seats_source_title"] },
    ]);
  });

  it("treats a missing or unknown license as incomplete", () => {
    const r = run(
      csv(
        row({ body_license: "unknown" }),
        row({ id: "m-2", trunk_license: "" }),
      ),
    );
    expect(r.incomplete.map((m) => m.missing[0])).toEqual([
      'body_license ("unknown" — licență neconfirmată)',
      "trunk_license",
    ]);
  });

  it("names the line of an incomplete engine row", () => {
    const r = run(
      csv(row(), row({ brand: "", consumption_l100km: "", hp: "90" })),
    );
    expect(r.incomplete[0].missing).toEqual(["consumption_l100km (line 3)"]);
  });

  it("writes a readable report", () => {
    const md = formatReport(run(csv(row({ price_low_eur: "" }))), "2026-10-16");
    expect(md).toContain("Incomplete: 1");
    expect(md).toContain("`m-1` (t.csv:2): price_low_eur");
  });
});

describe("manual price entry", () => {
  it("requires at least 10 listings", () => {
    expect(messages(csv(row({ n_listings: "9" })))).toContain(
      "2: n_listings must be at least 10, got 9",
    );
  });

  it("rejects prices collected more than 60 days before the import, or in the future", () => {
    expect(messages(csv(row({ collected_on: "2026-08-01" })))).toContain(
      "2: collected_on 2026-08-01 is older than 60 days; collect prices again",
    );
    expect(messages(csv(row({ collected_on: "2026-08-17" })))).toEqual([]);
    expect(messages(csv(row({ collected_on: "2026-10-20" })))).toContain(
      "2: collected_on 2026-10-20 is in the future",
    );
  });

  it("only accepts asking prices with a known verification state", () => {
    expect(messages(csv(row({ kind: "sold_price" })))).toContain(
      '2: kind must be "asking_price", got "sold_price"',
    );
    expect(messages(csv(row({ price_verification: "ok" })))[0]).toMatch(
      /price_verification must be/,
    );
  });

  it("requires a price source and license", () => {
    expect(
      run(csv(row({ price_source_url: "", price_license: "" }))).incomplete[0]
        .missing,
    ).toEqual(["price_source_url", "price_license"]);
  });

  it("keeps notes", () => {
    expect(
      run(csv(row({ notes: "doar anunțuri din București" }))).catalog!.models[0]
        .price_eur?.notes,
    ).toBe("doar anunțuri din București");
  });
});

describe("report: fields without source", () => {
  it("lists only identity fields when everything is sourced", () => {
    expect(run(csv(row())).unsourced).toEqual([
      {
        id: "m-1",
        fields: ["brand, model, generation (fără coloană de sursă)"],
      },
    ]);
  });

  it("lists groups missing a value, source or license, per engine line, and a missing price", () => {
    const r = run(
      csv(
        row({
          trunk_source_url: "",
          body_license: "unknown",
          price_low_eur: "",
        }),
        row({ brand: "", hp: "" }),
      ),
    );
    expect(r.unsourced![0].fields).toEqual([
      "brand, model, generation (fără coloană de sursă)",
      "body: licență neconfirmată",
      "trunk_l",
      "energy, cc, hp, consumption_l100km, consumption_cycle (linia 3)",
      "preț (price_low_eur, price_high_eur, n_listings, collected_on, kind, sursă, licență)",
    ]);
    expect(formatReport(r, "2026-10-16")).toContain(
      "## Câmpuri fără sursă, pe model",
    );
  });
});

describe("invalid values are errors", () => {
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
    const m = messages(csv(row({ year_from: "2021", price_low_eur: "9000" })));
    expect(m).toContain("2: year_from 2021 > year_to 2020");
    expect(m).toContain("2: price_low_eur 9000 > price_high_eur 6000");
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
      { updated: "2026-10-16" },
    );
    expect(r.errors[0].message).toBe(
      "duplicate id (first used on a.csv line 2)",
    );
  });

  it("rejects values outside V1 and unknown states", () => {
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
  const r = csvToCatalog(
    [
      {
        name: "data/cars.template.csv",
        text: readFileSync("data/cars.template.csv", "utf8"),
      },
    ],
    {
      updated: JSON.parse(readFileSync("src/data/cars.public.json", "utf8"))
        .updated,
    },
  );

  it("imports without errors", () => {
    expect(r.errors).toEqual([]);
  });

  it("public catalog never contains incomplete or unverified models", () => {
    const ids = new Set(r.catalog!.models.map((m) => m.id));
    for (const m of r.incomplete) expect(ids.has(m.id)).toBe(false);
    for (const id of r.unverified) expect(ids.has(id)).toBe(false);
  });

  it("matches the committed cars.public.json", () => {
    const committed = JSON.parse(
      readFileSync("src/data/cars.public.json", "utf8"),
    );
    expect(r.catalog!.models.map((m) => m.id)).toEqual(
      committed.models.map((m: { id: string }) => m.id),
    );
  });
});

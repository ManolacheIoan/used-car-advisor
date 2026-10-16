import { describe, expect, it } from "vitest";
import {
  auditBrandFiles,
  auditCatalog,
  auditDrafts,
  auditText,
} from "@/lib/audit";
import type { Catalog } from "@/lib/types";
import { car, price } from "./fixtures";

const TODAY = "2026-10-16";
const cat = (...models: Catalog["models"]) => ({ updated: TODAY, models });

describe("auditCatalog", () => {
  it("passes a verified, licensed row with a fresh manual price", () => {
    expect(auditCatalog(cat(car()), TODAY)).toEqual([]);
  });

  it("fails demo or unverified rows", () => {
    expect(
      auditCatalog(cat(car({ is_demo: true, verified: false })), TODAY),
    ).toEqual(["t: is_demo=true", "t: verified=false"]);
  });

  it("fails sources without url, date or a confirmed license", () => {
    const s = {
      source_title: "x",
      source_url: "",
      retrieved_on: "",
      license: "unknown",
    };
    expect(auditCatalog(cat(car({ sources: [s] })), TODAY)).toHaveLength(3);
    const demoLicense = {
      source_title: "x",
      source_url: "https://a",
      retrieved_on: TODAY,
      license:
        "CC BY-SA 4.0 (ani); caroserie: licență neconfirmată (doar DEMO)",
    };
    expect(
      auditCatalog(cat(car({ sources: [demoLicense] })), TODAY)[0],
    ).toMatch(/confirmed license/);
  });

  it("fails prices that are synthetic, unverified, under 10 listings or older than 60 days", () => {
    expect(
      auditCatalog(
        cat(
          car({
            price_eur: price(1, 2, { kind: "synthetic", n_listings: null }),
          }),
        ),
        TODAY,
      ).join(),
    ).toMatch(/asking price.*n_listings/);
    expect(
      auditCatalog(
        cat(car({ price_eur: price(1, 2, { verified: false }) })),
        TODAY,
      ),
    ).toEqual(["t: price verified=false"]);
    expect(
      auditCatalog(
        cat(car({ price_eur: price(1, 2, { n_listings: 9 }) })),
        TODAY,
      ),
    ).toEqual(["t: price n_listings < 10"]);
    expect(
      auditCatalog(
        cat(car({ price_eur: price(1, 2, { collected_on: "2026-08-01" }) })),
        TODAY,
      )[0],
    ).toMatch(/not within 60 days/);
  });
});

describe("auditBrandFiles", () => {
  it("requires a licence file next to every logo", () => {
    expect(
      auditBrandFiles([".gitkeep", "bmw.svg", "bmw.LICENSE.txt", "audi.png"]),
    ).toEqual(["public/brands/audi.png: no licence file (audi.LICENSE.txt)"]);
  });
});

describe("auditText", () => {
  it("finds listing-site names and demo/draft markers", () => {
    expect(
      auditText({
        "a.html": "date de pe Autovit.ro",
        "b.js": "preț sintetic DEMO",
        "c.html": "ok",
      }),
    ).toEqual([
      'a.html: contains "autovit"',
      'b.js: contains demo/draft marker "preț sintetic DEMO"',
    ]);
  });
});

describe("auditDrafts", () => {
  it("fails when a draft guide was built", () => {
    expect(
      auditDrafts(
        ["ghid-a", "ghid-b"],
        ["ghiduri/ghid-a/index.html", "index.html"],
      ),
    ).toEqual(['draft guide "ghid-a" is in the public build']);
  });
});

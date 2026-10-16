import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import assets from "@/data/brandAssets.json";
import { brandId } from "@/lib/brand";
import { scanBrandFiles } from "../../scripts/brand-assets";

describe("brandId", () => {
  it.each([
    ["Škoda", "skoda"],
    ["Mercedes-Benz", "mercedes-benz"],
    ["Volkswagen", "volkswagen"],
    ["  Alfa Romeo ", "alfa-romeo"],
  ])("%s → %s", (brand, id) => expect(brandId(brand)).toBe(id));
});

describe("brand asset manifest", () => {
  it("only accepts <brand-id>.svg|png with a licence file next to it, svg first", () => {
    const files = [
      "skoda.png",
      "skoda.svg",
      "skoda.LICENSE.txt",
      ".gitkeep",
      "Bad Name.svg",
      "bmw.jpg",
      "dacia.png",
      "dacia.LICENSE.txt",
      "audi.svg",
    ];
    expect(scanBrandFiles(files)).toEqual({
      dacia: "/brands/dacia.png",
      skoda: "/brands/skoda.svg",
    });
  });

  it("matches public/brands (run npm run prebuild after adding files)", () => {
    expect(assets).toEqual(scanBrandFiles(readdirSync("public/brands")));
  });
});

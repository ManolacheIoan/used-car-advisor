import { describe, expect, it } from "vitest";
import { groupByBrand, yearsSpan } from "@/lib/taxonomy";
import { car } from "./fixtures";

describe("groupByBrand", () => {
  const ms = [
    car({
      id: "a",
      brand: "Škoda",
      model: "Octavia",
      generation: "III",
      years: { from: 2013, to: 2020 },
    }),
    car({
      id: "b",
      brand: "Škoda",
      model: "Octavia",
      generation: "II",
      years: { from: 2004, to: 2013 },
    }),
    car({
      id: "c",
      brand: "Dacia",
      model: "Logan MCV",
      generation: "II",
      years: { from: 2013, to: 2020 },
    }),
  ];

  it("groups by brand id and model slug, generations by year", () => {
    const g = groupByBrand(ms);
    expect(g.map((b) => [b.id, b.count])).toEqual([
      ["dacia", 1],
      ["skoda", 2],
    ]);
    expect(g[0].lines[0].slug).toBe("logan-mcv");
    expect(g[1].lines[0].generations.map((m) => m.id)).toEqual(["b", "a"]);
  });

  it("formats the production span", () => {
    expect(yearsSpan(ms.slice(0, 2))).toBe("2004–2020");
  });
});

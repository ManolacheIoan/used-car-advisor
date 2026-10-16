import { describe, expect, it } from "vitest";
import { modelFaq } from "@/lib/faq";
import { similarModels } from "@/lib/similar";
import { suitability } from "@/lib/suitability";
import { car, engine } from "./fixtures";

const l = (value: number) => ({
  value,
  unit: "l/100km" as const,
  cycle: "NEDC" as const,
});

describe("similarModels", () => {
  const m = car({
    id: "golf7",
    brand: "VW",
    model: "Golf",
    years: { from: 2012, to: 2020 },
  });
  const all = [
    m,
    car({
      id: "golf6",
      brand: "VW",
      model: "Golf",
      years: { from: 2008, to: 2012 },
    }),
    car({
      id: "astra",
      brand: "Opel",
      model: "Astra",
      years: { from: 2015, to: 2021 },
    }),
    car({
      id: "focus",
      brand: "Ford",
      model: "Focus",
      years: { from: 2004, to: 2010 },
    }),
    car({ id: "suv", body: "suv", years: { from: 2012, to: 2020 } }),
  ];
  it("same body, other lines first, closest period", () => {
    expect(similarModels(m, all).map((x) => x.id)).toEqual([
      "astra",
      "focus",
      "golf6",
    ]);
  });
});

describe("suitability", () => {
  it("applies the usage rules to the cheapest-to-run engine", () => {
    const s = suitability(
      car({ body: "hatchback", engines: [engine({ consumption: l(5) })] }),
    );
    expect(s.find((x) => x.usage === "oras")).toMatchObject({
      suits: true,
      score: 1,
    });
    expect(s).toHaveLength(4);
  });
});

describe("modelFaq", () => {
  it("answers only from data and mentions mixed cycles", () => {
    const m = car({
      engines: [
        engine({ consumption: l(5) }),
        engine({ consumption: { value: 6, unit: "l/100km", cycle: "WLTP" } }),
      ],
    });
    const faq = modelFaq(m);
    expect(faq[0].a).toBe("Conform sursei din catalog, între 2015 și 2020.");
    expect(faq[2].a).toContain("cicluri de test diferite");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import demo from "@/data/cars.demo.json";
import { buildDemoCatalog, type DemoIdentity } from "@/lib/demoData";

const input = JSON.parse(readFileSync("data/demo-models.json", "utf8")) as {
  generated_on: string;
  models: DemoIdentity[];
};

describe("demo catalog", () => {
  it("is fully reproducible from data/demo-models.json (fixed seed)", () => {
    expect(buildDemoCatalog(input.models, input.generated_on)).toEqual(demo);
  });

  it("marks every row and price as demo, unverified and synthetic", () => {
    for (const m of buildDemoCatalog(input.models, input.generated_on).models) {
      expect(m.is_demo && !m.verified).toBe(true);
      expect(m.price_eur).toMatchObject({
        kind: "synthetic",
        n_listings: null,
        is_demo: true,
        verified: false,
      });
      expect(m.price_eur!.low).toBeLessThanOrEqual(m.price_eur!.high);
      expect(m.sources.some((s) => s.license === "synthetic")).toBe(true);
    }
  });

  it("depends only on identity: the same model always gets the same values", () => {
    const one = input.models.slice(0, 1);
    expect(buildDemoCatalog(one, "2026-01-01").models[0].price_eur!.low).toBe(
      buildDemoCatalog(input.models, "2026-01-01").models[0].price_eur!.low,
    );
  });
});

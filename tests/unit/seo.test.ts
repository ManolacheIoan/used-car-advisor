import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { models } from "@/lib/data";
import { isIndexable, modelJsonLd } from "@/lib/seo";
import { car } from "./fixtures";

describe("seo", () => {
  it("example models are not indexable", () => {
    expect(isIndexable(car({ is_demo: true }))).toBe(false);
    expect(isIndexable(car({ verified: false }))).toBe(false);
    expect(isIndexable(car())).toBe(true);
  });

  it("sitemap excludes example and unverified models", () => {
    const urls = sitemap().map((e) => e.url);
    for (const m of models.filter((x) => !isIndexable(x)))
      expect(urls.some((u) => u.includes(`/masini/${m.id}/`))).toBe(false);
  });

  it("JSON-LD only uses fields from data", () => {
    const ld = modelJsonLd(car({ id: "x" }));
    expect(ld["@type"]).toBe("Car");
    expect(ld).not.toHaveProperty("aggregateRating");
    expect(ld).not.toHaveProperty("offers");
  });
});

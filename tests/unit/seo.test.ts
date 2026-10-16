import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { isIndexable, modelJsonLd } from "@/lib/seo";
import { car } from "./fixtures";

describe("seo", () => {
  it("example models are not indexable", () => {
    expect(isIndexable(car({ example: true }))).toBe(false);
    expect(isIndexable(car())).toBe(true);
  });

  it("sitemap excludes example models", () => {
    expect(sitemap().some((e) => e.url.includes("/masini/exemplu-"))).toBe(
      false,
    );
  });

  it("JSON-LD only uses fields from data", () => {
    const ld = modelJsonLd(car({ id: "x" }));
    expect(ld["@type"]).toBe("Car");
    expect(ld).not.toHaveProperty("aggregateRating");
    expect(ld).not.toHaveProperty("offers");
  });
});

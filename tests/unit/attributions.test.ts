import { describe, expect, it } from "vitest";
import { collectAttributions, needsShareAlike } from "@/lib/attributions";
import { car, price } from "./fixtures";

describe("collectAttributions", () => {
  it("deduplicates sources, counts models, includes prices and configs", () => {
    const s = {
      source_title: "W",
      source_url: "https://w.example/a",
      retrieved_on: "2026-10-01",
      license: "CC BY-SA 4.0",
    };
    const list = collectAttributions([
      car({ id: "a", sources: [s] }),
      car({
        id: "b",
        sources: [{ ...s, retrieved_on: "2026-10-05" }],
        price_eur: price(1, 2),
      }),
    ]);
    const w = list.find((x) => x.url === s.source_url)!;
    expect(w).toMatchObject({ models: 2, retrieved_on: "2026-10-05" });
    expect(list.some((x) => x.usedFor === "prețuri")).toBe(true);
    expect(list.some((x) => x.usedFor === "prețuri carburant")).toBe(true);
    expect(needsShareAlike(list)).toBe(true);
  });
});

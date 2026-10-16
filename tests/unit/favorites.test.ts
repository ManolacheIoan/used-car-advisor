import { describe, expect, it } from "vitest";
import { MAX_FAVORITES, parseFavorites, toggleFavorite } from "@/lib/favorites";

const known = new Set(["a", "b", "c"]);

describe("favorites", () => {
  it("parses stored ids, dropping unknown, duplicate and non-string values", () => {
    expect(parseFavorites('["a","x","a",3,"c"]', known)).toEqual(["a", "c"]);
  });

  it.each([null, "", "not json", "{}", '"a"'])("treats %j as empty", (raw) => {
    expect(parseFavorites(raw, known)).toEqual([]);
  });

  it("toggles", () => {
    expect(toggleFavorite(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleFavorite(["a", "b"], "a")).toEqual(["b"]);
  });

  it(`keeps at most ${MAX_FAVORITES}, dropping the oldest`, () => {
    const many = Array.from({ length: MAX_FAVORITES }, (_, i) => `m${i}`);
    const next = toggleFavorite(many, "new");
    expect(next).toHaveLength(MAX_FAVORITES);
    expect(next.at(-1)).toBe("new");
    expect(next).not.toContain("m0");
  });
});

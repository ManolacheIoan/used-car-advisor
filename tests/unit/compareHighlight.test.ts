import { describe, expect, it } from "vitest";
import { bestIndexes, differs } from "@/lib/compareHighlight";

describe("bestIndexes", () => {
  it("finds the minimum or maximum, with ties", () => {
    expect(bestIndexes([500, 420, 420, 600], "min")).toEqual([1, 2]);
    expect(bestIndexes([300, 590, 480], "max")).toEqual([1]);
  });
  it("ignores missing values and needs at least two different values", () => {
    expect(bestIndexes([null, 5, 7], "min")).toEqual([1]);
    expect(bestIndexes([5, null], "min")).toEqual([]);
    expect(bestIndexes([5, 5, 5], "min")).toEqual([]);
  });
});

describe("differs", () => {
  it("detects differing values", () => {
    expect(differs(["SUV", "SUV"])).toBe(false);
    expect(differs(["SUV", "Sedan"])).toBe(true);
  });
});

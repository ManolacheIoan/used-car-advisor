import { describe, expect, it, vi } from "vitest";

// Brand validation depends on the catalog; use a fixed brand list independent of the data mode.
vi.mock("@/lib/data", () => ({ BRANDS: [["dacia", "Dacia"]] }));
import { DEFAULT_ASSUMPTIONS } from "@/lib/cost";
import {
  assumptionsFromQuery,
  assumptionsToQuery,
  prefsFromQuery,
  prefsToQuery,
  validatePrefs,
  type PrefsInput,
} from "@/lib/validation";

const ok: PrefsInput = {
  budgetMin: "20000",
  budgetMax: "50000",
  usage: "oras",
  fuel: "benzina",
  body: "oricare",
  brand: "oricare",
  seats: "5",
  kmYear: "12000",
};

describe("validatePrefs", () => {
  it("accepts valid input", () => {
    const r = validatePrefs(ok);
    expect(r.errors).toEqual({});
    expect(r.prefs?.budgetMax).toBe(50000);
  });

  it.each([
    ["budgetMin", "abc"],
    ["budgetMin", "-5"],
    ["budgetMin", "1.5"],
    ["budgetMax", "99999999"],
    ["usage", "zbor"],
    ["fuel", "electric"],
    ["body", "cabrio"],
    ["brand", "lada"],
    ["seats", "3"],
    ["kmYear", "0"],
    ["kmYear", ""],
  ])("rejects %s = %j", (field, value) => {
    const r = validatePrefs({ ...ok, [field]: value });
    expect(r.prefs).toBeUndefined();
    expect(r.errors).toHaveProperty(field);
  });

  it("rejects min > max", () => {
    const r = validatePrefs({ ...ok, budgetMin: "60000" });
    expect(r.errors.budgetMax).toMatch(/cel puțin egal/);
  });

  it("accepts a known brand and treats a missing brand as any", () => {
    expect(validatePrefs({ ...ok, brand: "dacia" }).prefs?.brand).toBe("dacia");
    expect(validatePrefs({ ...ok, brand: "" }).prefs?.brand).toBe("oricare");
  });

  it("accepts min = max", () => {
    expect(validatePrefs({ ...ok, budgetMin: "50000" }).prefs).toBeDefined();
  });
});

describe("query round-trips", () => {
  it("prefs", () => {
    const { prefs } = validatePrefs(ok);
    expect(prefsFromQuery(prefsToQuery(prefs!)).prefs).toEqual(prefs);
  });

  it("assumptions only store non-defaults", () => {
    const a = { ...DEFAULT_ASSUMPTIONS, insuranceYear: 999 };
    const q = assumptionsToQuery(a);
    expect([...q.keys()]).toEqual(["rca"]);
    expect(assumptionsFromQuery(q)).toEqual(a);
  });

  it("a filled fixed cost round-trips, an empty one means not set", () => {
    const a = { ...DEFAULT_ASSUMPTIONS, roadTaxYear: 250 };
    expect(assumptionsFromQuery(assumptionsToQuery(a))).toEqual(a);
    expect(
      assumptionsFromQuery(new URLSearchParams("tax=")).roadTaxYear,
    ).toBeNull();
    expect(
      assumptionsFromQuery(new URLSearchParams("pb=")).fuelPrice.benzina,
    ).toBe(DEFAULT_ASSUMPTIONS.fuelPrice.benzina);
  });

  it("invalid assumptions fall back to defaults", () => {
    const q = new URLSearchParams("pb=-1&rca=abc");
    expect(assumptionsFromQuery(q)).toEqual(DEFAULT_ASSUMPTIONS);
  });
});

import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("showcase mode (local screenshots only)", () => {
  it("cannot be combined with a public build", async () => {
    vi.stubEnv("DATA_MODE", "public");
    vi.stubEnv("SHOWCASE", "1");
    await expect(import("../../next.config")).rejects.toThrow(/SHOWCASE/);
  });

  it("builds into out-showcase/, never out/", async () => {
    vi.stubEnv("DATA_MODE", "demo");
    vi.stubEnv("SHOWCASE", "1");
    const cfg = (await import("../../next.config")).default;
    expect(cfg.distDir).toBe("out-showcase");
    expect(cfg.env?.NEXT_PUBLIC_DATA_MODE).toBe("demo");
  });

  it("is never enabled by the deploy config", () => {
    expect(readFileSync("netlify.toml", "utf8")).not.toMatch(/SHOWCASE/);
  });

  it("hides DEMO wording in source titles only in showcase", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "demo");
    vi.stubEnv("NEXT_PUBLIC_SHOWCASE", "1");
    const on = await import("@/lib/mode");
    expect(on.IS_SHOWCASE).toBe(true);
    expect(on.shownSourceTitle("Valori sintetice DEMO (x)")).not.toMatch(
      /DEMO/,
    );
    expect(on.shownSourceTitle("Wikidata")).toBe("Wikidata");

    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "public");
    const off = await import("@/lib/mode");
    expect(off.IS_SHOWCASE).toBe(false);
    expect(off.shownSourceTitle("Valori sintetice DEMO (x)")).toMatch(/DEMO/);
  });
});

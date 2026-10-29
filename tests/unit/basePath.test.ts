import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("base path (GitHub Pages sub-path)", () => {
  it("is off by default", async () => {
    vi.stubEnv("BASE_PATH", undefined);
    const cfg = (await import("../../next.config")).default;
    expect(cfg.basePath).toBeUndefined();
    expect(cfg.env?.NEXT_PUBLIC_BASE_PATH).toBe("");
  });

  it("is passed to Next and to the client", async () => {
    vi.stubEnv("BASE_PATH", "/used-car-advisor");
    vi.stubEnv("SITE_URL", "https://example.github.io/used-car-advisor");
    const cfg = (await import("../../next.config")).default;
    expect(cfg.basePath).toBe("/used-car-advisor");
    expect(cfg.env?.NEXT_PUBLIC_BASE_PATH).toBe("/used-car-advisor");
    expect(cfg.env?.NEXT_PUBLIC_SITE_URL).toBe(
      "https://example.github.io/used-car-advisor",
    );
  });

  it.each(["used-car-advisor", "/used-car-advisor/", "/a b"])(
    "rejects a malformed value (%s)",
    async (v) => {
      vi.stubEnv("BASE_PATH", v);
      await expect(import("../../next.config")).rejects.toThrow(/BASE_PATH/);
    },
  );

  it("prefixes root-relative URLs with withBase", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/used-car-advisor");
    const { withBase } = await import("@/lib/site");
    expect(withBase("/sw.js")).toBe("/used-car-advisor/sw.js");

    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    const root = await import("@/lib/site");
    expect(root.withBase("/sw.js")).toBe("/sw.js");
  });

  it("the Pages preview keeps the DEMO banner (never the showcase build)", () => {
    const wf = readFileSync(".github/workflows/pages.yml", "utf8");
    expect(wf).toMatch(/npm run build:demo/);
    expect(wf).toMatch(/path: out-demo/);
    expect(wf).not.toMatch(/SHOWCASE|build:showcase|out-showcase/);
  });
});

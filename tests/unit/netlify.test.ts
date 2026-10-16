import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Comments are ignored: they may mention the demo mode to explain that it is never deployed.
const toml = readFileSync("netlify.toml", "utf8").replace(/^\s*#.*$/gm, "");

describe("netlify.toml", () => {
  it("builds and publishes only the public mode, gated by the audit", () => {
    expect(toml).toMatch(/DATA_MODE = "public"/);
    expect(toml).toMatch(/publish = "out"/);
    expect(toml).toMatch(/npm run audit:public/);
    expect(toml).not.toMatch(/out-demo|DATA_MODE = "demo"/);
  });

  it("sets security headers and caching rules", () => {
    for (const h of [
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
      "frame-ancestors 'none'",
    ])
      expect(toml).toContain(h);
    expect(toml).toMatch(/_next\/static[\s\S]*immutable/);
  });
});

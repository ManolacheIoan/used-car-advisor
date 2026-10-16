import { defineConfig, devices } from "@playwright/test";

/**
 * Two builds are tested:
 *  - demo   (out-demo, synthetic data): user flows, tools, accessibility, PWA;
 *  - public (out, verified data only): demo and draft content must be absent.
 * Build both first: npm run build && npm run build:demo
 */
export default defineConfig({
  testDir: "tests/e2e",
  projects: [
    {
      name: "demo",
      testIgnore: /public\.spec\.ts/,
      use: { baseURL: "http://localhost:3000", ...devices["Pixel 7"] },
    },
    {
      name: "public",
      testMatch: /public\.spec\.ts/,
      use: { baseURL: "http://localhost:3001", ...devices["Pixel 7"] },
    },
  ],
  webServer: [
    {
      command: "npm run serve:demo",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npx serve out -l 3001",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
    },
  ],
});

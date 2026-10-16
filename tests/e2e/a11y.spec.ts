import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// WCAG 2.1 A/AA checks on the main pages (DEMO build), in both themes.
const PAGES = [
  "/",
  "/catalog/?caroserie=suv",
  "/marci/",
  "/marci/volkswagen/",
  "/masini/vw-golf-7/",
  "/rezultate/?bmin=4000&bmax=15000&u=familie&f=oricare&c=oricare&s=5&km=12000",
  "/compara/?ids=vw-golf-7,dacia-duster-2,skoda-octavia-3",
  "/calculator-cost/",
  "/calculator-finantare/",
  "/buget/",
  "/favorite/",
  "/ghiduri/checklist-test-drive/",
  "/metodologie/",
  "/despre-date/",
  "/surse/",
];

for (const theme of ["dark", "light"] as const)
  for (const path of PAGES)
    test(`axe ${theme} ${path}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const summary = r.violations.map(
        (v) =>
          `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`,
      );
      expect(summary, summary.join("\n")).toEqual([]);
    });

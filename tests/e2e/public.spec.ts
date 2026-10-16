import { expect, test } from "@playwright/test";

// Runs against the PUBLIC build (out/): nothing demo, draft or unverified may appear.
test("no demo banner, no demo models", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("DEMO: valori fictive")).toHaveCount(0);
  const res = await page.goto("/masini/vw-golf-7/");
  expect(res?.status()).toBe(404);
});

test("draft guides are excluded", async ({ page, request }) => {
  await page.goto("/ghiduri/");
  await expect(page.getByText("Ghidurile sunt în pregătire")).toBeVisible();
  expect((await request.get("/ghiduri/checklist-test-drive/")).status()).toBe(
    404,
  );
  await page.goto("/glosar/");
  await expect(page.getByText("Pagina este în pregătire")).toBeVisible();
});

test("sitemap and robots contain no demo or draft pages", async ({
  request,
}) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/masini/");
  expect(sitemap).not.toMatch(/\/ghiduri\/[a-z]/);
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
});

test("recommendations explain that no verified prices exist yet", async ({
  page,
}) => {
  await page.goto(
    "/rezultate/?bmin=4000&bmax=15000&u=familie&f=oricare&c=oricare&s=5&km=12000",
  );
  await expect(page.getByText("Încă nu avem prețuri verificate")).toBeVisible();
});

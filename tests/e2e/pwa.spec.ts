import { expect, test } from "@playwright/test";

test("installable: manifest and icons", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  const manifest = await (await request.get(href!)).json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons)
    expect((await request.get(icon.src)).ok()).toBe(true);
});

test("offline: precached pages work and unknown pages show the offline page", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // let the worker control the page
  await context.setOffline(true);
  await page.goto("/despre-date/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Despre date și limitări" }),
  ).toBeVisible();
  await page.goto("/marci/volkswagen/");
  await expect(page.getByText("Ești offline")).toBeVisible();
  await context.setOffline(false);
});

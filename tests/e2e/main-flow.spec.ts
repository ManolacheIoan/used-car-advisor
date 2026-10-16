import { expect, test } from "@playwright/test";

test("form → results → compare → detail", async ({ page }) => {
  await page.goto("/");

  // Step 1: invalid budget is rejected, then fixed.
  await page.getByLabel("Maxim (€)").fill("1000");
  await page.getByRole("button", { name: "Continuă" }).click();
  await expect(page.getByText("cel puțin egal cu minimul")).toBeVisible();
  await page.getByLabel("Maxim (€)").fill("20000");
  await page.getByRole("button", { name: "Continuă" }).click();

  await page.getByText("Familie", { exact: true }).click();
  await page.getByRole("button", { name: "Continuă" }).click();
  await page.getByRole("button", { name: "Continuă" }).click(); // any fuel, any body
  await page.getByRole("button", { name: "Vezi recomandările" }).click();

  await expect(page).toHaveURL(/\/rezultate\//);
  const cards = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("meter") });
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByText("orientativ").first()).toBeVisible();

  await cards.nth(0).getByLabel("Compară").check();
  await cards.nth(1).getByLabel("Compară").check();
  await page.getByRole("link", { name: "Compară" }).click();

  await expect(page).toHaveURL(/\/compara\/.*ids=/);
  await expect(page.getByRole("table")).toBeVisible();
  const firstModel = page.getByRole("columnheader").nth(1).getByRole("link");
  const name = await firstModel.innerText();
  await firstModel.click();

  await expect(page).toHaveURL(/\/masini\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByRole("heading", { name: "Surse" })).toBeVisible();
});

test("no match shows a relax option", async ({ page }) => {
  await page.goto(
    "/rezultate/?bmin=20000&bmax=50000&u=mixt&f=gpl&c=mpv&s=7&km=12000",
  );
  await expect(page.getByText("Niciun model nu se potrivește")).toBeVisible();
  await page.getByRole("link", { name: /Orice combustibil/ }).click();
  await expect(page.getByRole("meter").first()).toBeVisible();
});

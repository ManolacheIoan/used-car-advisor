// Runs against the DEMO build (synthetic values): npm run build:demo && npm run test:e2e
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
  await page.getByText("Dacia", { exact: true }).click(); // any fuel, any body, one brand
  await page.getByRole("button", { name: "Continuă" }).click();
  await page.getByRole("button", { name: "Vezi recomandările" }).click();

  await expect(page).toHaveURL(/\/rezultate\//);
  const cards = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("meter") });
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThanOrEqual(2);
  for (const title of await cards
    .getByRole("heading", { level: 2 })
    .allInnerTexts())
    expect(title).toContain("Dacia");
  await expect(page.getByText("orientativ").first()).toBeVisible();
  await expect(
    page.getByText("preț sintetic DEMO, nu provine din anunțuri").first(),
  ).toBeVisible();
  await expect(
    page.getByText("DEMO: valori fictive, nu pentru decizii reale"),
  ).toBeVisible();

  await cards.nth(0).getByLabel("Compară").check();
  await cards.nth(1).getByLabel("Compară").check();
  await page.getByRole("link", { name: "Compară", exact: true }).click();

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
    "/rezultate/?bmin=3000&bmax=12000&u=mixt&f=oricare&c=hatchback&m=bmw&s=5&km=12000",
  );
  await expect(page.getByText("Niciun model nu se potrivește")).toBeVisible();
  await page.getByRole("link", { name: /Relaxează: orice marcă/ }).click();
  await expect(page.getByRole("meter").first()).toBeVisible();
});

test("favorites, compare shortcut and reset", async ({ page }) => {
  await page.goto(
    "/rezultate/?bmin=4000&bmax=15000&u=familie&f=oricare&c=oricare&s=5&km=12000",
  );
  const first = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("meter") })
    .first();
  await first.getByRole("button", { name: /Salvează .* la favorite/ }).click();
  await expect(page.getByRole("link", { name: "Favorite (1)" })).toBeVisible();

  await page.getByRole("link", { name: /Compară primele 3/ }).click();
  await expect(page).toHaveURL(/\/compara\/.*ids=/);
  await expect(page.getByRole("columnheader")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Printează" })).toBeVisible();

  await page.getByRole("link", { name: "Favorite (1)" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Favorite" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Scoate .* din favorite/ }).click();
  await expect(page.getByText("Nu ai salvat încă niciun model")).toBeVisible();

  await page.goto(
    "/rezultate/?bmin=4000&bmax=15000&u=familie&f=oricare&c=oricare&s=5&km=12000",
  );
  await page.getByRole("link", { name: "Resetează filtrele" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel("Minim (€)")).toHaveValue("4000");
});

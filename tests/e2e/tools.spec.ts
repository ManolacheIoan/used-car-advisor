import { expect, test } from "@playwright/test";

test("catalog: filters are kept in the URL, reset clears them", async ({
  page,
}) => {
  await page.goto("/catalog/");
  await page.getByRole("button", { name: /^Filtre/ }).click();
  await page.getByLabel("Caroserie").selectOption("suv");
  await expect(page).toHaveURL(/caroserie=suv/);
  const count = page.locator("#catalog-results");
  await expect(count).toContainText("generați");
  await page.getByLabel("Sortare").selectOption("an-desc");
  await expect(page).toHaveURL(/sortare=an-desc/);
  for (const t of await page.locator("main h2 a").allInnerTexts())
    expect(t.length).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Resetează filtrele" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/catalog\/$/);
});

test("catalog: search suggests models", async ({ page }) => {
  await page.goto("/catalog/");
  await page.getByRole("combobox", { name: /Caută/ }).fill("Golf");
  await expect(page.getByRole("option").first()).toContainText("Golf");
});

test("model page: specs with test cycle, cost, FAQ, sources", async ({
  page,
}) => {
  await page.goto("/masini/vw-golf-7/");
  await expect(
    page.getByRole("navigation", { name: "Navigare ierarhică" }),
  ).toContainText("Volkswagen");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Volkswagen Golf",
  );
  await expect(
    page.getByRole("cell", { name: /(NEDC|WLTP)/ }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cost de utilizare orientativ" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cui i se potrivește" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Întrebări frecvente" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Surse" })).toBeVisible();
  await page.getByRole("button", { name: "Adaugă la comparație" }).click();
  await expect(
    page.getByRole("button", { name: "Scoate din comparație" }),
  ).toBeVisible();
});

test("TCO calculator: totals, unset fields and views", async ({ page }) => {
  await page.goto("/calculator-cost/");
  await page.getByLabel("RCA (lei/an)").fill("1200");
  await expect(
    page.getByText(/Necompletate \(calculate cu 0\):/),
  ).toContainText("Impozit");
  await expect(page.getByRole("cell", { name: "1.200 lei" })).toBeVisible(); // RCA yearly
  await page.getByRole("radio", { name: "Total 5 ani" }).click();
  await expect(
    page.getByRole("radio", { name: "Total 5 ani" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("cell", { name: "6.000 lei" })).toBeVisible(); // RCA × 5
});

test("financing calculator: annuity payment and validation", async ({
  page,
}) => {
  await page.goto("/calculator-finantare/");
  await page.getByLabel(/Preț mașină/).fill("12000");
  await page.getByLabel(/Avans/).fill("2000");
  await page.getByLabel(/Dobândă anuală/).fill("12");
  await page.getByLabel(/Perioadă/).fill("12");
  await expect(page.getByText("888 €").first()).toBeVisible(); // 10 000 at 1 %/month over 12 months
  await page.getByLabel(/Avans/).fill("20000");
  await expect(
    page.getByRole("form", { name: "Date credit" }).getByRole("alert"),
  ).toContainText("Avansul nu poate depăși prețul");
});

test("guides: list, guide page with 'ghid orientativ' and draft label in demo", async ({
  page,
}) => {
  await page.goto("/ghiduri/");
  await page.getByRole("link", { name: /Checklist pentru test drive/ }).click();
  await expect(
    page.getByText("ghid orientativ", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/CIORNĂ/)).toBeVisible();
  await expect(page.getByRole("checkbox").first()).toBeVisible();
});

import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/dashboard");
  await page.locator('input[type="email"]').fill("sara@greenhills.example");
  await page.locator('input[type="password"]').fill("demo1234");
  await page.locator('button[type="submit"]').click();
  const mfaField = page.locator('input[placeholder="000000"]');
  if (await mfaField.isVisible({ timeout: 5000 }).catch(() => false)) {
    await mfaField.fill("000000");
    await page.getByRole("button", { name: /verify & sign in/i }).click();
  }
  await page.getByText(/welcome back/i).waitFor({ timeout: 10_000 });
}

test("Business Impact Dashboard shows an honest empty state with no leads", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Business Impact", exact: true }).click();
  await expect(page.getByText("No leads captured yet")).toBeVisible();
});

test("Business Impact Dashboard computes real numbers from a captured lead", async ({ context }) => {
  const companion = await context.newPage();
  const dashboard = await context.newPage();

  await companion.goto("/companion");
  await companion.getByText("Load demo", { exact: true }).click();
  await companion.getByText("Proposal", { exact: true }).click();
  await companion.getByRole("button", { name: /save lead to crm/i }).click();
  await expect(companion.getByText("Saved to CRM")).toBeVisible();

  await login(dashboard);
  await dashboard.getByRole("button", { name: "Business Impact", exact: true }).click();
  await expect(dashboard.getByText("Revenue influenced")).toBeVisible();
  // Green Hills (the demo scenario's top match) is $285,000 — a real number
  // read straight off the lead the companion just saved, not a mock.
  await expect(dashboard.getByText("$285,000").first()).toBeVisible();
  await expect(dashboard.getByText("Real Estate")).toBeVisible();
});

test("Customer Journey and Product Heatmap reflect a real captured lead", async ({ context }) => {
  const companion = await context.newPage();
  const dashboard = await context.newPage();

  await companion.goto("/companion");
  await companion.getByText("Load demo", { exact: true }).click();
  await companion.getByText("Proposal", { exact: true }).click();
  await companion.getByRole("button", { name: /save lead to crm/i }).click();
  await expect(companion.getByText("Saved to CRM")).toBeVisible();

  await login(dashboard);
  await dashboard.getByRole("button", { name: "Analytics", exact: true }).click();
  await dashboard.getByText("Customer journey", { exact: true }).scrollIntoViewIfNeeded();

  // Pipeline stage distribution — real, computed from the one lead just saved.
  await expect(dashboard.getByText("New", { exact: true })).toBeVisible();
  await expect(dashboard.getByText("100% of leads")).toBeVisible();

  // Heatmap shows the real item name, not a mock product list.
  await expect(dashboard.getByText("Green Hills", { exact: true }).first()).toBeVisible();
});

test("Compare view explains why each alternative ranks behind the top match", async ({ context }) => {
  const companion = await context.newPage();
  const display = await context.newPage();

  await display.goto("/display");
  const pairingClose = display.locator('div:has-text("Connect your phone") button').first();
  if (await pairingClose.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pairingClose.click();
  }

  await companion.goto("/companion");
  await companion.getByText("Load demo", { exact: true }).click();
  await companion.getByRole("button", { name: "Compare" }).click();

  const whyNot = display.getByText(/Why it.s behind/i);
  await expect(whyNot.first()).toBeVisible({ timeout: 5000 });
  const count = await whyNot.count();
  expect(count).toBeGreaterThanOrEqual(2); // both non-winning cards get an explanation
});

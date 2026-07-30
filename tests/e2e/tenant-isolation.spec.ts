import { test, expect } from "@playwright/test";
import { login } from "./helpers";
import { resetTestData } from "./reset";

test.beforeEach(async () => {
  await resetTestData();
  const res = await fetch("http://localhost:3001/api/test/seed-second-tenant", { method: "POST" });
  if (!res.ok) throw new Error(`Second-tenant seed failed: HTTP ${res.status}`);
});

/**
 * The one test that actually catches a forgotten `tenantId` filter. This
 * app is single-tenant in practice in every other test, so a cross-tenant
 * data leak would otherwise be invisible — this seeds a second, unrelated
 * tenant with its own lead and asserts Sara (green-hills) never sees it.
 */
test("a tenant's leads never include another tenant's data", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Leads", exact: true }).click();
  await expect(page.getByText("Acme Exclusive Villa")).toHaveCount(0);

  const res = await page.request.get("/api/leads");
  expect(res.ok()).toBeTruthy();
  const { leads } = await res.json();
  expect(leads.some((l: { itemName: string }) => l.itemName === "Acme Exclusive Villa")).toBe(false);
});

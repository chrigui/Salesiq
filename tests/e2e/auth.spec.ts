import { test, expect } from "@playwright/test";
import { login, DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

test("signs in with the real credential + MFA flow", async ({ page }) => {
  await login(page);
  await expect(page.getByText("Welcome back, Sara")).toBeVisible();
});

test("rejects a wrong password", async ({ page }) => {
  await page.goto("/dashboard");
  await page.locator('input[type="email"]').fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').fill("not-the-password");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText(/isn't right/i)).toBeVisible({ timeout: 5000 });
});

test("signs out back to the login screen", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
});

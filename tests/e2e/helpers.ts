import type { Page } from "@playwright/test";

export const DEMO_EMAIL = "sara@greenhills.example";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_MFA_CODE = "000000";

/** Signs in through the real login + MFA flow used by the Company Dashboard. */
export async function login(page: Page, email = DEMO_EMAIL) {
  await page.goto("/dashboard");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
  await page.locator('button[type="submit"]').click();

  const mfaField = page.locator('input[placeholder="000000"]');
  if (await mfaField.isVisible({ timeout: 5000 }).catch(() => false)) {
    await mfaField.fill(DEMO_MFA_CODE);
    await page.getByRole("button", { name: /verify & sign in/i }).click();
  }

  await page.getByText(/welcome back/i).waitFor({ timeout: 10_000 });
}

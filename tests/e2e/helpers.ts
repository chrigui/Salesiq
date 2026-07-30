import type { Page } from "@playwright/test";

export const DEMO_EMAIL = "sara@greenhills.example";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_MFA_CODE = "000000";

/** Signs in through the real login + MFA flow used by the Company Dashboard. */
export async function login(page: Page, email = DEMO_EMAIL) {
  await page.goto("/dashboard");
  await page.locator('input[type="email"]').waitFor({ timeout: 15_000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
  await page.locator('button[type="submit"]').click();

  const mfaField = page.locator('input[placeholder="000000"]');
  const welcomeText = page.getByText(/welcome back/i);

  // The login POST is a real network round-trip now, not a synchronous
  // localStorage read — wait for whichever the async response resolves to
  // (the MFA prompt, or straight to the dashboard for non-MFA accounts)
  // instead of a single instantaneous isVisible() check that would race it.
  await Promise.race([
    mfaField.waitFor({ state: "visible", timeout: 15_000 }),
    welcomeText.waitFor({ state: "visible", timeout: 15_000 }),
  ]).catch(() => {});

  if (await mfaField.isVisible().catch(() => false)) {
    await mfaField.fill(DEMO_MFA_CODE);
    await page.getByRole("button", { name: /verify & sign in/i }).click();
  }

  await welcomeText.waitFor({ timeout: 15_000 });
}

import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/**
 * Permanent customer-safety guard for the Customer Display Experience
 * (CustDisplay-PR1/PR4): every view this plan added or extended — Matches,
 * the LUMMA Recap on the big screen, and the public /continue phone page —
 * must never leak customer.phone/email/notes, mirroring the discipline
 * property-discovery.spec.ts already enforces for the earlier Property
 * Discovery views. Wired through the real customerSafe.ts seam
 * (toCustomerSafeItem/toCustomerSafeCustomerName), not asserted by
 * convention alone.
 */
function assertNeverLeaksPrivateFields(body: string) {
  expect(body).not.toContain("+357 99 123 456");
  expect(body).not.toContain("sara@example.com");
  expect(body).not.toContain("Relocating with two school-age children");
}

async function dismissPairing(page: import("@playwright/test").Page) {
  const pairingClose = page.locator('div:has-text("Connect your phone") button').first();
  if (await pairingClose.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pairingClose.click();
  }
}

async function reachExplorer(companion: import("@playwright/test").Page) {
  await companion.getByRole("button", { name: "Skip setup" }).click();
  await companion.getByText("Load demo", { exact: true }).click();
  await companion.evaluate(() => {
    sessionStorage.setItem(
      "salesiq.companion.meetingFlow",
      JSON.stringify({ stage: "explore", wizardGroupIndex: 0 }),
    );
  });
  await companion.reload();
  await expect(companion.getByRole("heading", { name: "Your matches" })).toBeVisible({ timeout: 10_000 });
}

async function shortlist(companion: import("@playwright/test").Page, nameMatch: RegExp) {
  await companion.getByRole("button", { name: "All properties" }).click();
  await companion.getByRole("button", { name: nameMatch }).first().click();
  await companion.getByRole("button", { name: /Add to shortlist|In shortlist/ }).click();
  await companion.getByRole("button", { name: "Back" }).first().click();
}

test("Customer Display never leaks private customer fields across Matches, Recap, or the phone continuation", async ({
  context,
}) => {
  const companion = await context.newPage();
  await login(companion);
  await companion.goto("/companion");
  const display = await context.newPage();
  await display.goto("/display");
  await dismissPairing(display);

  await reachExplorer(companion);

  // Matches (PR1): the "Show to customer" re-trigger on the Matches tab.
  await companion.getByRole("button", { name: "Show to customer" }).click();
  await expect(display.getByRole("heading", { name: "Your best matches" })).toBeVisible({ timeout: 5000 });
  assertNeverLeaksPrivateFields(await display.locator("body").innerText());

  // Build a real, multi-item recap via the Decision Room's per-card toggle.
  await shortlist(companion, /Green Hills/);
  await shortlist(companion, /Marina Vista/);
  await companion.getByRole("button", { name: "Shortlist" }).click();
  await companion.getByRole("button", { name: "Enter Decision Room" }).click();
  await companion.getByRole("button", { name: "Compare" }).click();
  await companion.getByRole("button", { name: "Add to recap" }).first().click();
  await companion.getByRole("button", { name: "Add to recap" }).first().click();
  await expect(companion.getByRole("button", { name: "In recap" })).toHaveCount(2);

  await companion.getByRole("button", { name: "Recommend", exact: true }).click();
  await companion.getByRole("button", { name: "Create LUMMA recap" }).click();

  // Recap (Display): real content, "Also considered" present, no leaks.
  await expect(display.getByRole("heading", { name: "Your LUMMA recap" })).toBeVisible({ timeout: 5000 });
  await expect(display.getByText("Also considered")).toBeVisible();
  assertNeverLeaksPrivateFields(await display.locator("body").innerText());

  // Public phone continuation, opened fresh (same-context sync only —
  // this sandbox can't reach the real external MQTT broker cross-context).
  const displayUrl = new URL(display.url());
  const room = displayUrl.searchParams.get("room");
  expect(room).toBeTruthy();

  const phone = await context.newPage();
  await phone.goto(`/continue?room=${room}`);
  await expect(phone.getByRole("heading", { name: /LUMMA recap/i })).toBeVisible({ timeout: 8000 });
  await expect(phone.getByText("Also considered")).toBeVisible();
  assertNeverLeaksPrivateFields(await phone.locator("body").innerText());
});

import { test, expect, type BrowserContext } from "@playwright/test";

/**
 * The Customer Display and the Sales Companion are two independent tabs
 * sharing one Zustand session store over BroadcastChannel (same-origin,
 * same-browser — see core/store/session.ts's connectSessionSync). Opening
 * both in the same browser context exercises that real sync path instead of
 * mocking it.
 */
async function openCompanionAndDisplay(context: BrowserContext) {
  const display = await context.newPage();
  const companion = await context.newPage();
  await display.goto("/display");
  await companion.goto("/companion");
  return { companion, display };
}

test("presenting a proposal from the companion appears live on the customer display", async ({ context }) => {
  const { companion, display } = await openCompanionAndDisplay(context);

  await companion.getByText("Load demo", { exact: true }).click();
  await companion.getByText("Proposal", { exact: true }).click();
  await expect(companion.getByText("Prepared for")).toBeVisible();

  await companion.getByRole("button", { name: /present on customer screen/i }).click();
  await expect(companion.getByText("Presented on screen")).toBeVisible();

  // Dismiss the display's pairing overlay (unrelated cross-device feature)
  // if it's covering the presentation.
  const pairingClose = display.locator('div:has-text("Connect your phone") button').first();
  if (await pairingClose.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pairingClose.click();
  }

  await expect(display.getByText("Prepared for")).toBeVisible({ timeout: 5000 });
  await expect(display.getByText("Sara Haddad")).toBeVisible();
  await expect(display.getByText("Also considered")).toBeVisible();
  await expect(display.getByText(/\$\d/).first()).toBeVisible();
});

test("Compare view also mirrors live from companion to display", async ({ context }) => {
  const { companion, display } = await openCompanionAndDisplay(context);

  await companion.getByText("Load demo", { exact: true }).click();
  await companion.getByRole("button", { name: "Compare" }).click();
  await expect(display.getByText("Your top matches, side by side")).toBeVisible({ timeout: 5000 });

  // The real-estate demo pack's inventory carries lifestyle-map data, so
  // "Recommend" hands off to the Interactive Lifestyle Map hero instead of
  // the plain recommendation card — this asserts that real branch, not a
  // hardcoded string that only matches packs without map data.
  await companion.getByRole("button", { name: "Recommend" }).click();
  await expect(display.getByText("Based on your preferences")).toBeVisible({ timeout: 5000 });
});

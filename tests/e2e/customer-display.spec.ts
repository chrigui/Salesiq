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

test("an item's photo gallery loads real local images and swaps the hero on click", async ({ context }) => {
  const { companion, display } = await openCompanionAndDisplay(context);

  const pairingClose = display.locator('div:has-text("Connect your phone") button').first();
  if (await pairingClose.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pairingClose.click();
  }

  // Automotive's inventory has no lifestyle-map data, so its item view is
  // the plain ItemStage — the one with the gallery thumbnail strip.
  await companion.getByRole("button", { name: "Automotive", exact: true }).click();
  await companion.getByRole("button", { name: /Apex S/ }).click();

  const thumbs = display.locator('button[aria-label^="Show photo"]');
  await expect(thumbs).toHaveCount(4, { timeout: 5000 });

  const heroImg = display.locator("img").first();
  await expect(heroImg).toHaveAttribute("src", /\/industries\/automotive\/apex-s\/hero\.png/);

  // Every generated photo actually resolves (200), not a broken link.
  for (const src of [
    "/industries/automotive/apex-s/hero.png",
    "/industries/automotive/apex-s/gallery-detail.png",
    "/industries/automotive/apex-s/gallery-twilight.png",
    "/industries/automotive/apex-s/gallery-texture.png",
  ]) {
    const res = await display.request.get(src);
    expect(res.ok(), src).toBeTruthy();
  }

  await thumbs.nth(2).click();
  await expect(heroImg).toHaveAttribute("src", /gallery-twilight\.png/, { timeout: 3000 });
});

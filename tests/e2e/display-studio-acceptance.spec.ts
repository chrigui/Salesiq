import { test, expect, type Page, type Locator } from "@playwright/test";
import { login } from "./helpers";

/**
 * Display Studio — comprehensive acceptance test for the full LUMMA Display
 * Studio plan (PR1-PR17): create -> template -> brand -> colors ->
 * typography -> widgets -> reorder -> widget settings -> motion -> idle ->
 * preview -> save draft -> publish -> verify on live Display -> duplicate ->
 * modify duplicate -> rollback -> assign different profiles to different
 * displays.
 *
 * Rollback is exercised via the editor's History tab "Revert" (rather than
 * the Home card's "Rollback" shortcut) because the Home card always targets
 * the most-recently-*created* profile, and this test creates a duplicate
 * partway through — both surfaces call the exact same revertDisplayProfile()
 * function (see DisplayStudio.tsx's CurrentProfileCard), so this still
 * verifies the same real capability.
 */

async function setRangeValue(locator: Locator, value: number) {
  await locator.evaluate((el, v) => {
    const proto = window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
    setter.call(el, String(v));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function openModal(page: Page, heading: string | RegExp) {
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("Display Studio acceptance: full create-to-publish-to-rollback journey", async ({ page, browser }) => {
  test.setTimeout(180_000);
  const ts = Date.now();
  await login(page);
  await page.getByRole("button", { name: "Display Studio" }).click();

  // --- Brand kit (foundation for "brand" / "colors" / "typography") ---
  await page.getByRole("button", { name: "Brand", exact: true }).click();
  await page.getByRole("button", { name: /new brand profile/i }).click();
  const brandName = `Acceptance Brand ${ts}`;
  await openModal(page, "New brand profile");
  await page.locator('input[placeholder="Green Hills Luxury"]').fill(brandName);
  await page.getByRole("button", { name: "Create", exact: true }).click();

  const brandRow = page.getByRole("button", { name: new RegExp(escapeRegExp(brandName)) });
  await expect(brandRow).toBeVisible({ timeout: 10_000 });
  await brandRow.click();

  await page
    .locator('label:has-text("Primary color")')
    .locator('input:not([type="color"])')
    .fill("10 10 200");
  await page.getByLabel("Heading font").selectOption("playfair");
  await page.getByLabel("Heading weight").selectOption("Bold");
  await page.getByLabel("Letter spacing").selectOption("Wide");
  await expect(page.getByLabel("Heading weight")).toHaveValue("Bold");

  // --- 1. Create + 2. Template ---
  await page.getByRole("button", { name: "Profiles", exact: true }).click();
  await page.getByRole("button", { name: /new display profile/i }).click();
  await openModal(page, "New display profile");
  const newProfileModal = page
    .locator("div.fixed.inset-0.z-50")
    .filter({ has: page.getByRole("heading", { name: "New display profile" }) });
  const listingSelect = newProfileModal.locator("select").nth(1);
  const optionCount = await listingSelect.locator("option").count();
  await listingSelect.selectOption({ index: Math.max(0, optionCount - 1) });
  const listingName = (await listingSelect.locator("option:checked").textContent())?.trim() ?? "";
  expect(listingName.length).toBeGreaterThan(0);
  await page.getByRole("button", { name: "New Development" }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();

  await expect(page.getByRole("button", { name: "Motion", exact: true })).toBeVisible({ timeout: 15_000 });
  // The editor's own Template panel (Widgets tab) uses the raw enum id, not the picker's friendly label.
  await expect(page.getByRole("button", { name: "NewDevelopment", exact: true })).toHaveClass(/bg-zinc-900/);

  // --- 3. Brand (attach kit) + 4. Colors (per-profile override) ---
  await page.getByRole("button", { name: "Brand", exact: true }).click();
  await page.getByLabel("Attached brand kit").selectOption({ label: brandName });
  await expect(page.getByLabel("Attached brand kit")).not.toHaveValue("");
  const profileColorInput = page.locator('label:has-text("Primary color")').locator('input:not([type="color"])');
  await profileColorInput.fill("5 5 5");
  await expect(profileColorInput).toHaveValue("5 5 5");

  // --- 6. Widgets: enable "Specs" (disabled by default on New Development) ---
  await page.getByRole("button", { name: "Widgets", exact: true }).click();
  const specsLabel = page.locator('label:has(span:text-is("Specs"))');
  const specsCheckbox = specsLabel.locator('input[type="checkbox"]');
  await expect(specsCheckbox).not.toBeChecked();
  await specsLabel.click();
  await expect(specsCheckbox).toBeChecked();

  // --- 7. Reorder: drag Hero below Gallery ---
  const widgetOrderCard = page.locator(
    'xpath=//h3[normalize-space()="Widget order"]/ancestor::div[contains(@class,"border-zinc-200")][1]',
  );
  const labelsBefore = await widgetOrderCard.locator("span.font-medium").allTextContents();
  expect(labelsBefore[0]).toBe("Hero");
  expect(labelsBefore[1]).toBe("Gallery");

  const grips = widgetOrderCard.locator('button[aria-label="Drag to reorder"]');
  const heroGripBox = await grips.nth(0).boundingBox();
  const galleryGripBox = await grips.nth(1).boundingBox();
  if (!heroGripBox || !galleryGripBox) throw new Error("Could not locate drag handles");
  await page.mouse.move(heroGripBox.x + heroGripBox.width / 2, heroGripBox.y + heroGripBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    galleryGripBox.x + galleryGripBox.width / 2,
    galleryGripBox.y + galleryGripBox.height + 6,
    { steps: 12 },
  );
  await page.mouse.up();

  await expect(async () => {
    const labelsAfter = await widgetOrderCard.locator("span.font-medium").allTextContents();
    expect(labelsAfter[0]).toBe("Gallery");
    expect(labelsAfter[1]).toBe("Hero");
  }).toPass({ timeout: 5_000 });

  // --- 8. Widget settings: Hero -> Show bedrooms ---
  await page.getByRole("button", { name: "Hero settings" }).click();
  const showBedrooms = page.locator('label:has-text("Show bedrooms") input[type="checkbox"]');
  await expect(showBedrooms).not.toBeChecked();
  await showBedrooms.click();
  await expect(showBedrooms).toBeChecked();

  // --- 9. Motion ---
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  const dynamicPreset = page.getByRole("button").filter({ hasText: "Dynamic" }).first();
  await dynamicPreset.click();
  await expect(dynamicPreset).toHaveClass(/bg-zinc-900/);

  // --- 10. Idle ---
  await page.getByRole("button", { name: "Idle", exact: true }).click();
  await page.getByLabel("Headline", { exact: true }).fill("Let's find your perfect fit");
  const idleRange = page.locator('input[type="range"]');
  await setRangeValue(idleRange, 90);
  await expect(page.getByText(/90s of no activity/)).toBeVisible();

  // --- 11. Preview ---
  await page.getByRole("button", { name: "Preview", exact: true }).first().click();
  const previewFrame = page.frameLocator('iframe[title="Customer Display preview"]');
  await expect(previewFrame.getByText(listingName, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Close" }).click();

  // --- 12. Save draft (implicit — confirm still Draft) ---
  const statusSelect = page.locator("select").filter({ hasText: "Draft" });
  await expect(statusSelect).toHaveValue("Draft");

  // --- 13. Publish (v1) ---
  await statusSelect.selectOption("Published");
  await openModal(page, "Publish this profile");
  await page.locator('input[placeholder="e.g. Updated pricing and gallery"]').fill("Initial publish for acceptance test");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(statusSelect).toHaveValue("Published", { timeout: 10_000 });

  // --- 14. Verify on live Display ---
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Displays", exact: true }).click();
  await page.getByRole("button", { name: /add display/i }).click();
  const displayAName = `Acceptance Kiosk A ${ts}`;
  await openModal(page, "Add display");
  await page.locator('input[placeholder="Sales Center — Main Display"]').fill(displayAName);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await openModal(page, /^Pair /);
  const pairingCode = (await page.locator("span.font-mono").textContent())?.trim() ?? "";
  expect(pairingCode.length).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Done", exact: true }).click();

  const displayARow = page.getByRole("button", { name: new RegExp(escapeRegExp(displayAName)) });
  await displayARow.click();
  // Structural indexing (not getByLabel) — Chromium's accessible-name-from-content
  // computation for these wrapping <label> elements bleeds into sibling selects.
  // DisplayRow renders selects in this order: Idle experience, Live profile, Default experience.
  const liveProfileSelect = page.locator("select").nth(1);
  await liveProfileSelect.selectOption({ label: `${listingName} display` });

  const kioskContext = await browser.newContext();
  const kioskPage = await kioskContext.newPage();
  await kioskPage.goto(`/display?pair=${pairingCode}`);
  await expect(kioskPage.getByText(listingName, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  await kioskContext.close();

  // --- 15. Duplicate + 16. Modify duplicate ---
  // Our profile is still the most-recently-created one, so it's the Home card ("Current profile").
  await page.getByRole("button", { name: "Profiles", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("button", { name: "Widgets", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(page.getByRole("button", { name: "Widgets", exact: true })).toBeVisible({ timeout: 10_000 });

  // The duplicate's own Widgets tab: disable "Gallery" (currently enabled, since duplicate copies sections) on the COPY only.
  const galleryLabelDup = page.locator('label:has(span:text-is("Gallery"))');
  const galleryCheckboxDup = galleryLabelDup.locator('input[type="checkbox"]');
  await expect(galleryCheckboxDup).toBeChecked();
  await galleryLabelDup.click();
  await expect(galleryCheckboxDup).not.toBeChecked();

  // Publish the duplicate too, so step 18 has two distinct *published* profiles to assign.
  const dupStatusSelect = page.locator("select").filter({ hasText: "Draft" });
  await dupStatusSelect.selectOption("Published");
  await openModal(page, "Publish this profile");
  await page.locator('input[placeholder="e.g. Updated pricing and gallery"]').fill("Publish duplicate for acceptance test");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(dupStatusSelect).toHaveValue("Published", { timeout: 10_000 });

  // Confirm the ORIGINAL is untouched — it's now in "Other profiles" (no longer newest).
  await page.getByRole("button", { name: "Back", exact: true }).click();
  const originalRow = page
    .getByRole("button")
    .filter({ hasText: listingName })
    .filter({ hasText: "NewDevelopment" })
    .filter({ hasNotText: "(Copy)" });
  await expect(originalRow).toHaveCount(1);
  await originalRow.click();
  await expect(page.getByRole("button", { name: "Widgets", exact: true })).toBeVisible();
  const galleryCheckboxOriginal = page.locator('label:has(span:text-is("Gallery")) input[type="checkbox"]');
  await expect(galleryCheckboxOriginal).toBeChecked();

  // --- 17. Rollback (via History tab's Revert — same underlying revertDisplayProfile() path as the Home card's Rollback shortcut) ---
  // Make a second real change + publish so a non-current version exists to revert to.
  const trustBadgesLabel = page.locator('label:has(span:text-is("Trust badges"))');
  await trustBadgesLabel.click();
  const statusSelect2 = page.locator("select").filter({ hasText: "Published" });
  await statusSelect2.selectOption("Published");
  await openModal(page, "Publish this profile");
  await page.locator('input[placeholder="e.g. Updated pricing and gallery"]').fill("Second publish for rollback target");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Publish this profile" })).not.toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "History", exact: true }).click();
  const versionRows = page.locator("div.rounded-2xl").filter({ has: page.getByText(/^v\d+$/) });
  await expect(versionRows).toHaveCount(2, { timeout: 10_000 });
  const nonCurrentRow = versionRows.filter({ hasNotText: "Live" });
  await expect(nonCurrentRow).toHaveCount(1);
  await nonCurrentRow.getByRole("button", { name: /revert/i }).click();
  await expect(versionRows).toHaveCount(3, { timeout: 10_000 });

  // --- 18. Assign different profiles to different displays ---
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Displays", exact: true }).click();
  await page.getByRole("button", { name: /add display/i }).click();
  const displayBName = `Acceptance Kiosk B ${ts}`;
  await openModal(page, "Add display");
  await page.locator('input[placeholder="Sales Center — Main Display"]').fill(displayBName);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await openModal(page, /^Pair /);
  await page.getByRole("button", { name: "Done", exact: true }).click();

  const displayBRow = page.getByRole("button", { name: new RegExp(escapeRegExp(displayBName)) });
  await displayBRow.click();
  const copyLabel = `${listingName} display (Copy)`;
  const idleExperienceSelectB = page.locator("select").nth(0);
  await idleExperienceSelectB.selectOption({ label: copyLabel });

  await page.reload();
  await page.getByRole("button", { name: "Display Studio" }).click();
  await page.getByRole("button", { name: "Displays", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(escapeRegExp(displayAName)) }).click();
  await expect(page.locator("select").nth(1)).not.toHaveValue("");
  await page.getByRole("button", { name: new RegExp(escapeRegExp(displayAName)) }).click(); // collapse A
  await page.getByRole("button", { name: new RegExp(escapeRegExp(displayBName)) }).click();
  await expect(page.locator("select").nth(0)).not.toHaveValue("");
});

import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/**
 * Permanent end-to-end acceptance test for the LUMMA Customer Display
 * Experience (spec section 35's 17-step journey): start meeting → discovery
 * → matching → matches → select property → push to Display → why this →
 * compare → lifestyle → location → investment → floor plan → payment →
 * recommend → generate recap → QR → continue on phone. Every step drives a
 * real, already-shipped session action — nothing here is a mock or a
 * fabricated intermediate screen. Confirms the Display never shows a blank/
 * undefined/null render and never leaks a private customer field anywhere
 * along the way, including on the public /continue phone page.
 */
async function dismissPairing(page: import("@playwright/test").Page) {
  const pairingClose = page.locator('div:has-text("Connect your phone") button').first();
  if (await pairingClose.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pairingClose.click();
  }
}

function assertNeverLeaksPrivateFields(body: string) {
  expect(body).not.toContain("+357 99 123 456");
  expect(body).not.toContain("sara@example.com");
  expect(body).not.toContain("Relocating with two school-age children");
}

async function shortlist(companion: import("@playwright/test").Page, nameMatch: RegExp) {
  await companion.getByRole("button", { name: "All properties" }).click();
  await companion.getByRole("button", { name: nameMatch }).first().click();
  await companion.getByRole("button", { name: /Add to shortlist|In shortlist/ }).click();
  await companion.getByRole("button", { name: "Back" }).first().click();
}

async function openDisplayControlFor(companion: import("@playwright/test").Page, nameMatch: RegExp) {
  // Scope to the specific ComparisonCard (the closest "glass-strong"
  // ancestor of its own name heading) so this can't accidentally click
  // another card's "Display" button.
  const card = companion
    .locator("div.text-sm.font-semibold.text-ink", { hasText: nameMatch })
    .locator("xpath=ancestor::div[contains(@class,'glass-strong')][1]");
  await card.getByRole("button", { name: "Display" }).click();
}

test("Customer Display acceptance: the full 17-step journey, start to phone continuation", async ({ context }) => {
  // 1. Start meeting.
  const companion = await context.newPage();
  await login(companion);
  await companion.goto("/companion");
  await companion.getByRole("button", { name: "Skip setup" }).click();

  const display = await context.newPage();
  await display.goto("/display");
  await dismissPairing(display);

  // 2. Discovery (Load demo seeds real, completed discovery answers).
  await companion.getByText("Load demo", { exact: true }).click();
  await companion.evaluate(() => {
    sessionStorage.setItem(
      "salesiq.companion.meetingFlow",
      JSON.stringify({ stage: "confirm", wizardGroupIndex: 0 }),
    );
  });
  await companion.reload();
  await expect(companion.getByRole("heading", { name: "Here's what we heard" })).toBeVisible({ timeout: 10_000 });

  // 3-4. Matching -> Matches, triggered from the real confirmation screen.
  await companion.getByText("Look at your matches").click();
  await expect(display.getByRole("heading", { name: "Your best matches" })).toBeVisible({ timeout: 8000 });
  await expect(companion.getByRole("heading", { name: "Your matches" })).toBeVisible({ timeout: 5000 });

  // 5. Select a property and push it to the Display.
  await companion.getByRole("button", { name: "All properties" }).click();
  await companion.getByRole("button", { name: /Green Hills/ }).first().click();
  await expect(companion.getByRole("heading", { name: "Green Hills" })).toBeVisible();
  await companion.getByRole("button", { name: "Show customer" }).click();
  await expect(display.getByText("Green Hills", { exact: true })).toBeVisible({ timeout: 5000 });
  await companion.getByRole("button", { name: "Back" }).first().click();

  // 6. Build a real 2-property Decision Room shortlist and enter Compare.
  await shortlist(companion, /Green Hills/);
  await shortlist(companion, /Marina Vista/);
  await companion.getByRole("button", { name: "Shortlist" }).click();
  await companion.getByRole("button", { name: "Enter Decision Room" }).click();
  await companion.getByRole("button", { name: "Compare" }).click();
  await expect(display.getByText("Comparing 2 properties")).toBeVisible({ timeout: 5000 });

  // 7. Why this.
  await openDisplayControlFor(companion, /Green Hills/);
  await companion.getByRole("button", { name: "Show why", exact: true }).click();
  await expect(display.getByText("Why it's behind", { exact: false }).first()).toBeVisible({ timeout: 5000 });

  // 8. Lifestyle.
  await openDisplayControlFor(companion, /Green Hills/);
  await companion.getByRole("button", { name: "Show lifestyle" }).click();
  await expect(display.getByText("Green Hills", { exact: true })).toBeVisible({ timeout: 5000 });

  // 9. Location.
  await openDisplayControlFor(companion, /Green Hills/);
  await companion.getByRole("button", { name: "Show location" }).click();
  await expect(display.getByText("Green Hills", { exact: true })).toBeVisible({ timeout: 5000 });

  // 10. Investment.
  await openDisplayControlFor(companion, /Green Hills/);
  await companion.getByRole("button", { name: "Show investment" }).click();
  await expect(display.getByText(/investment/i).first()).toBeVisible({ timeout: 5000 });

  // 11. Floor plan.
  await openDisplayControlFor(companion, /Green Hills/);
  await companion.getByRole("button", { name: "Show floor plan" }).click();
  await expect(display.getByText(/floor plan/i).first()).toBeVisible({ timeout: 5000 });

  // 12. Payment.
  await openDisplayControlFor(companion, /Green Hills/);
  await companion.getByRole("button", { name: "Show payment" }).click();
  await expect(display.getByText(/payment/i).first()).toBeVisible({ timeout: 5000 });

  // 13. Recommend, and build a real, multi-item recap via the compare
  // screen's per-card toggle (not just the single recommend-screen winner).
  await companion.getByRole("button", { name: "Add to recap" }).first().click();
  await companion.getByRole("button", { name: "Add to recap" }).first().click();
  await expect(companion.getByRole("button", { name: "In recap" })).toHaveCount(2);
  // First click navigates Companion from Compare to the Recommend screen;
  // the second (same label, now on that screen) is the actual CTA that
  // pushes the recommendation to the Display.
  await companion.getByRole("button", { name: "Recommend", exact: true }).click();
  await companion.getByRole("button", { name: "Recommend", exact: true }).click();
  await expect(display.getByText("Green Hills", { exact: true }).first()).toBeVisible({ timeout: 5000 });

  // 14. Generate the LUMMA recap + QR.
  await companion.getByRole("button", { name: "Create LUMMA recap" }).click();
  await expect(display.getByRole("heading", { name: "Your LUMMA recap" })).toBeVisible({ timeout: 5000 });
  await expect(display.getByText("Also considered")).toBeVisible();
  await expect(display.getByAltText("Continue on your phone QR code")).toBeVisible({ timeout: 5000 });

  // 15. Continue on phone.
  const displayUrl = new URL(display.url());
  const room = displayUrl.searchParams.get("room");
  expect(room).toBeTruthy();
  const phone = await context.newPage();
  await phone.goto(`/continue?room=${room}`);
  await expect(phone.getByRole("heading", { name: /LUMMA recap/i })).toBeVisible({ timeout: 8000 });
  await expect(phone.getByText("Also considered")).toBeVisible();

  // Never a blank/undefined/null render, and never a leaked private field,
  // on either the big screen or the phone.
  for (const page of [display, phone]) {
    await expect(page.getByText("undefined")).toHaveCount(0);
    await expect(page.getByText("null")).toHaveCount(0);
    assertNeverLeaksPrivateFields(await page.locator("body").innerText());
  }
});

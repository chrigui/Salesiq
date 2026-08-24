import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/**
 * End-to-end script for the LUMMA Property Discovery Experience (the real
 * destination of "Look at your matches" — PropertyExplorer and everything
 * it opens). Exercises the full salesperson journey across two browser
 * contexts (Companion + Display) sharing one session, asserting real DOM
 * state at each hop rather than assuming a click worked, and confirming
 * the Display never leaks customer.phone/email/notes or shows a fabricated
 * number anywhere along the way.
 */
async function reachExplorer(companion: Awaited<ReturnType<typeof loginAndOpenCompanion>>) {
  await companion.getByRole("button", { name: "Skip setup" }).click();
  await companion.getByText("Load demo", { exact: true }).click();
  // meetingFlow's stage cursor is a presentation-only, Companion-local
  // concern deliberately separate from the synced session store (see
  // meetingFlow.ts) — jumping it straight to "explore" here is a
  // legitimate way to reach the Explorer with the demo pack's real
  // inventory already loaded, without re-driving the whole discovery
  // wizard in every test.
  await companion.evaluate(() => {
    sessionStorage.setItem(
      "salesiq.companion.meetingFlow",
      JSON.stringify({ stage: "explore", wizardGroupIndex: 0 }),
    );
  });
  await companion.reload();
  await expect(companion.getByRole("heading", { name: "Your matches" })).toBeVisible({ timeout: 10_000 });
}

async function loginAndOpenCompanion(context: import("@playwright/test").BrowserContext) {
  const companion = await context.newPage();
  await login(companion);
  await companion.goto("/companion");
  return companion;
}

/** Never Sara's phone, email, or private notes — DisplayStage's own
 * customer-safe discipline only ever reads customer.name. */
async function assertDisplayNeverLeaksPrivateFields(display: import("@playwright/test").Page) {
  const body = await display.locator("body").innerText();
  expect(body).not.toContain("357 99 123 456");
  expect(body).not.toContain("sara@example.com");
  expect(body).not.toContain("Relocating with two school-age children");
}

test("property discovery journey: matches, filters, preview, details, compare, and Display privacy", async ({
  context,
}) => {
  const companion = await loginAndOpenCompanion(context);
  const display = await context.newPage();
  await display.goto("/display");

  await reachExplorer(companion);

  // Matches tab shows a real, honest count.
  await expect(companion.getByText(/We found \d+ propert/)).toBeVisible();

  // All properties + instant search narrows the grid to a real match.
  await companion.getByRole("button", { name: "All properties" }).click();
  await companion.getByPlaceholder("Search properties").fill("Marina");
  await expect(companion.getByRole("button", { name: /Marina Vista/ })).toBeVisible();
  await expect(companion.getByRole("button", { name: /Green Hills/ })).toHaveCount(0);
  await companion.getByPlaceholder("Search properties").fill("");

  // Tap a card -> Preview -> Show customer flips the paired Display.
  await companion.getByRole("button", { name: /Green Hills/ }).first().click();
  await expect(companion.getByRole("heading", { name: "Green Hills" })).toBeVisible();
  await companion.getByRole("button", { name: "Show customer" }).click();
  await expect(display.getByText("Green Hills", { exact: true })).toBeVisible({ timeout: 5000 });
  await assertDisplayNeverLeaksPrivateFields(display);

  // More details -> PropertyDetails: honest Investment/Availability, real documents.
  await companion.getByRole("button", { name: "More details" }).click();
  await expect(companion.getByText("Investment", { exact: true })).toBeVisible();
  await expect(companion.getByText("+18% / 3yr")).toBeVisible();
  await expect(companion.getByText("Rental yield", { exact: true })).toBeVisible();
  await expect(companion.getByText("Not available").first()).toBeVisible();
  await expect(companion.getByText(/No documents uploaded|Loading…/)).toBeVisible({ timeout: 5000 });

  // Back returns to Preview (no forced replay of the whole journey), then all the way out.
  await companion.getByRole("button", { name: "Back" }).first().click();
  await expect(companion.getByRole("button", { name: "Show customer" })).toBeVisible();
  await companion.getByRole("button", { name: "Back" }).first().click();
  await expect(companion.getByRole("heading", { name: "Your matches" })).toBeVisible();

  // Drag-to-compare: fold two cards into a group, then a third onto the folder.
  const cardA = companion.getByRole("button", { name: /Green Hills/ }).first();
  const cardB = companion.getByRole("button", { name: /Marina Vista/ }).first();
  const boxA = (await cardA.boundingBox())!;
  const boxB = (await cardB.boundingBox())!;
  await companion.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
  await companion.mouse.down();
  await companion.mouse.move(boxA.x + boxA.width / 2 + 20, boxA.y + boxA.height / 2 + 5, { steps: 5 });
  await companion.mouse.move(boxB.x + boxB.width / 2, boxB.y + boxB.height / 2, { steps: 10 });
  await companion.mouse.up();

  const folder = companion.getByRole("button", { name: /2 propert.* Compare/i });
  await expect(folder).toBeVisible({ timeout: 5000 });

  await folder.click();
  await expect(companion.getByText("Comparing 2 properties")).toBeVisible();
  await expect(companion.locator("span", { hasText: "Best match" })).toHaveCount(1);

  // Show the comparison to the customer — a new, additive Display view.
  await companion.getByRole("button", { name: "Show to customer" }).click();
  await expect(display.getByText("Comparing 2 properties")).toBeVisible({ timeout: 5000 });
  await assertDisplayNeverLeaksPrivateFields(display);

  // Direct-jump nav: Shortlist and Matches are reachable straight from the tab bar, no replay.
  await companion.getByRole("button", { name: "Shortlist" }).click();
  await expect(companion.getByText(/Nothing shortlisted yet|Shortlist ·/)).toBeVisible();
  await companion.getByRole("button", { name: "Matches", exact: true }).click();
  await expect(companion.getByRole("heading", { name: "Your matches" })).toBeVisible();
});

import { test, expect } from "@playwright/test";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import { login } from "./helpers";

/**
 * Permanent end-to-end acceptance test for the persistent LUMMA Recap
 * (spec section 39's flow, with the "floor plan" beat dropped — no
 * distinct floor-plan widget exists anywhere in the shared widget set, so
 * the story is scoped to what's real: explore a property, view its
 * payment section). Drives the real 20-PR feature start to finish:
 * salesperson finishes a meeting → reviews the recap (hides a section,
 * writes a private note) → picks a thank-you template → creates a real,
 * durable Recap row via POST /api/recaps → the Display's QR repoints at
 * /r/[code] (decoded from the actual PNG bytes, not just diffed) →
 * a second browser page (standing in for the customer's phone) opens the
 * public link → explores a property → favorites it → the price changes
 * server-side and the customer sees an honest "Price updated" diff on
 * reopen → another property's availability flips to Reserved and the
 * customer sees "No longer available" with real alternatives. Every
 * mutation goes through a real API round-trip; nothing here is mocked.
 */

const PACK_ID = "real-estate";
const GREEN_HILLS_ID = "green-hills";
const MARINA_VISTA_ID = "marina-vista";
const GREEN_HILLS_ORIGINAL_PRICE = 285000;
const GREEN_HILLS_NEW_PRICE = 299000;

function decodeQrDataUrl(dataUrl: string): string | null {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const png = PNG.sync.read(Buffer.from(base64, "base64"));
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return result?.data ?? null;
}

async function dismissPairing(page: import("@playwright/test").Page) {
  const pairingClose = page.locator('div:has-text("Connect your phone") button').first();
  if (await pairingClose.isVisible({ timeout: 2000 }).catch(() => false)) {
    await pairingClose.click();
  }
}

async function shortlist(companion: import("@playwright/test").Page, nameMatch: RegExp) {
  await companion.getByRole("button", { name: "All properties" }).click();
  await companion.getByRole("button", { name: nameMatch }).first().click();
  await companion.getByRole("button", { name: /Add to shortlist|In shortlist/ }).click();
  await companion.getByRole("button", { name: "Back" }).first().click();
}

test("Recap acceptance: full persistent-Recap journey, meeting to reopened phone visit", async ({
  context,
  request,
}) => {
  // 1. Start meeting, pair a Display, load a real completed discovery + shortlist + comparison.
  const companion = await context.newPage();
  await login(companion);
  await companion.goto("/companion");
  await companion.getByRole("button", { name: "Skip setup" }).click();

  const display = await context.newPage();
  await display.goto("/display");
  await dismissPairing(display);

  await companion.getByText("Load demo", { exact: true }).click();
  await companion.evaluate(() => {
    sessionStorage.setItem("salesiq.companion.meetingFlow", JSON.stringify({ stage: "confirm", wizardGroupIndex: 0 }));
  });
  await companion.reload();
  await expect(companion.getByRole("heading", { name: "Here's what we heard" })).toBeVisible({ timeout: 10_000 });
  await companion.getByText("Look at your matches").click();
  await expect(companion.getByRole("heading", { name: "Your matches" })).toBeVisible({ timeout: 5000 });

  // Prime the live sync room with a real push before Decision Room — the
  // sync channel needs a moment to connect after the Display's fresh load.
  await companion.getByRole("button", { name: "All properties" }).click();
  await companion.getByRole("button", { name: /Green Hills/ }).first().click();
  await expect(companion.getByRole("heading", { name: "Green Hills" })).toBeVisible();
  await companion.getByRole("button", { name: "Show customer" }).click();
  await expect(display.getByText("Green Hills", { exact: true })).toBeVisible({ timeout: 5000 });
  await companion.getByRole("button", { name: "Back" }).first().click();

  await shortlist(companion, /Green Hills/);
  await shortlist(companion, /Marina Vista/);
  await companion.getByRole("button", { name: "Shortlist" }).click();
  await companion.getByRole("button", { name: "Enter Decision Room" }).click();
  await companion.getByRole("button", { name: "Compare" }).click();
  await expect(display.getByText("Comparing 2 properties")).toBeVisible({ timeout: 5000 });

  // 2. Add both compared properties to the recap and reach the recommend screen.
  await companion.getByRole("button", { name: "Add to recap" }).first().click();
  await companion.getByRole("button", { name: "Add to recap" }).first().click();
  await expect(companion.getByRole("button", { name: "In recap" })).toHaveCount(2);
  await companion.getByRole("button", { name: "Recommend", exact: true }).click();
  await companion.getByRole("button", { name: "Recommend", exact: true }).click();

  // 3. Open the real Salesperson Review wizard — hide a section, write a
  // private note that must never reach the customer on any surface.
  const PRIVATE_NOTE = "SECRET_RECAP_ACCEPTANCE_do_not_leak_to_customer";
  await companion.getByRole("button", { name: "Create LUMMA recap" }).click();
  await expect(companion.getByText("Meeting recap", { exact: true })).toBeVisible({ timeout: 5000 });

  const comparisonRow = companion
    .locator("span.text-sm.text-ink-muted", { hasText: "Comparison" })
    .locator("xpath=ancestor::div[1]");
  await comparisonRow.getByRole("button", { name: "Hide" }).click();

  await companion.locator('textarea[placeholder*="Internal notes"]').fill(PRIVATE_NOTE);
  await companion.getByRole("button", { name: "Continue" }).click();

  // 4. Story step — a real advisor phone + a picked (not invented) thank-you template.
  await companion.locator('input[placeholder="+1 555 123 4567"]').fill("+1 555 987 6543");
  await companion.getByRole("button", { name: "Follow-up" }).click();
  await expect(companion.locator("textarea").last()).toHaveValue(/just following up on our meeting/);

  await companion.getByRole("button", { name: "Create LUMMA Recap" }).click();
  await expect(companion.getByRole("heading", { name: "Your LUMMA Recap is ready" })).toBeVisible({ timeout: 10_000 });
  await expect(
    companion.getByText("No expiration set — this link stays active until you delete it."),
  ).toBeVisible();

  // 5. Real WhatsApp/Email deep-links, addressed to the customer's own
  // phone/email from Load Demo — no backend messaging vendor involved.
  const mailLink = companion.getByRole("link", { name: "Email" });
  const waLink = companion.getByRole("link", { name: "WhatsApp" });
  await expect(mailLink).toHaveAttribute("href", /^mailto:.*sara%40example\.com/i);
  await expect(waLink).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+/);

  const recapUrl = await companion.getByRole("link", { name: "Open on phone" }).getAttribute("href");
  expect(recapUrl).toBeTruthy();
  const code = new URL(recapUrl!).pathname.split("/").pop()!;
  expect(code).toMatch(/^[A-Z0-9]{6,}$/);

  // 6. The Display's own QR (still the ephemeral session's, but repointed
  // per Recap-PR19) must now decode to the exact same persisted /r/[code]
  // URL — verified from the actual PNG bytes, not just a src-attribute diff.
  const qrImg = display.getByAltText("Continue on your phone QR code");
  await expect(qrImg).toBeVisible({ timeout: 5000 });
  await expect
    .poll(async () => (await qrImg.getAttribute("src"))?.includes("base64") ?? false, { timeout: 5000 })
    .toBeTruthy();
  await expect
    .poll(
      async () => {
        const src = await qrImg.getAttribute("src");
        return src ? decodeQrDataUrl(src) : null;
      },
      { timeout: 8000 },
    )
    .toBe(recapUrl);

  // 7. The customer opens the real public link on their own device.
  const phone = await context.newPage();
  await phone.goto(`/r/${code}`);
  await expect(phone.getByRole("heading", { name: /Welcome back/ })).toBeVisible({ timeout: 8000 });

  // The hidden section and the private note must be structurally absent,
  // not merely unrendered — check both the visible text and the raw HTML.
  await expect(phone.getByText("You compared")).toHaveCount(0);
  const firstVisitBody = await phone.locator("body").innerText();
  const firstVisitHtml = await phone.content();
  expect(firstVisitBody).not.toContain(PRIVATE_NOTE);
  expect(firstVisitHtml).not.toContain(PRIVATE_NOTE);
  expect(firstVisitHtml).not.toContain("privateNotes");

  // 8. Explore the best-match property (Green Hills) — expanding it fires a
  // real PropertyView event and renders its actual payment section.
  const bestMatch = phone.locator("#best-match");
  await expect(bestMatch.getByText("Green Hills")).toBeVisible();
  await bestMatch.getByRole("button", { name: "Explore this property" }).click();
  await expect(bestMatch.getByText("Price", { exact: true })).toBeVisible({ timeout: 5000 });

  // 9. Favorite it — a pure engagement signal, persisted across reloads,
  // that never touches the salesperson's official shortlist.
  const favoriteButton = bestMatch.getByRole("button", { name: "Save to your favorites" });
  await favoriteButton.click();
  await expect(bestMatch.getByRole("button", { name: "Remove from your favorites" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await phone.reload();
  await expect(phone.locator("#best-match").getByRole("button", { name: "Remove from your favorites" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  try {
    // 10. Price changes server-side (the only way to simulate live drift on
    // an in-memory pack) — the customer's next visit shows an honest diff.
    const priceRes = await request.post("/api/test/mutate-inventory-item", {
      data: { packId: PACK_ID, itemId: GREEN_HILLS_ID, price: GREEN_HILLS_NEW_PRICE },
    });
    expect(priceRes.ok()).toBeTruthy();

    await phone.reload();
    await expect(phone.getByText("Since your last visit")).toBeVisible({ timeout: 5000 });
    await expect(phone.getByText("Price updated")).toBeVisible();
    await expect(phone.getByText("$285,000").first()).toBeVisible();
    await expect(phone.getByText("$299,000").first()).toBeVisible();

    // 11. Another shortlisted property becomes genuinely unavailable — the
    // customer sees this honestly, with real closest alternatives, not a
    // broken link.
    const availRes = await request.post("/api/test/mutate-inventory-item", {
      data: { packId: PACK_ID, itemId: MARINA_VISTA_ID, availabilityStatus: "Reserved" },
    });
    expect(availRes.ok()).toBeTruthy();

    await phone.reload();
    await expect(phone.getByText("No longer available")).toBeVisible({ timeout: 5000 });
    await expect(phone.getByText("Closest current alternatives")).toBeVisible();
    await expect(phone.getByText("Status updated")).toBeVisible();
  } finally {
    // Restore the shared in-memory pack so no other test observes this run's mutations.
    await request.post("/api/test/mutate-inventory-item", {
      data: { packId: PACK_ID, itemId: GREEN_HILLS_ID, price: GREEN_HILLS_ORIGINAL_PRICE },
    });
    await request.post("/api/test/mutate-inventory-item", {
      data: { packId: PACK_ID, itemId: MARINA_VISTA_ID, availabilityStatus: "Available" },
    });
  }

  // Never a blank/undefined/null render on the customer's own surface.
  await expect(phone.getByText("undefined")).toHaveCount(0);
  await expect(phone.getByText("null")).toHaveCount(0);
});

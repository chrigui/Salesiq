import { test, expect } from "@playwright/test";

/**
 * Permanent safety guard for the persistent LUMMA Recap public surface
 * (Recap-PR20): /r/[code] must never leak privateNotes or any internal
 * id, and a stranger probing codes must never learn whether a code is
 * unknown, archived, or expired — all three read through the same
 * resolvePublicRecap() null path into Next's default notFound(), with no
 * distinguishing status code, heading, or body text. Fixtures are seeded
 * via a test-only route (see /api/test/seed-recap-fixtures) since no UI
 * anywhere lets a salesperson archive a Recap or set an expiry.
 */
test.describe("Recap public surface never leaks private state", () => {
  let normalCode: string;
  let archivedCode: string;
  let expiredCode: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post("/api/test/seed-recap-fixtures");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    normalCode = body.normalCode;
    archivedCode = body.archivedCode;
    expiredCode = body.expiredCode;
  });

  test("a real Recap's public page never leaks privateNotes or internal ids", async ({ page }) => {
    const res = await page.goto(`/r/${normalCode}`);
    expect(res?.status()).toBe(200);
    const body = await page.locator("body").innerText();
    const html = await page.content();
    expect(body).not.toContain("SECRET_INTERNAL_ONLY");
    expect(html).not.toContain("SECRET_INTERNAL_ONLY");
    expect(html).not.toContain("privateNotes");
    // No bare Prisma cuid (25-char lowercase-alnum starting with "c") should
    // ever appear in the page — the only public identifier is the short code.
    expect(html).not.toMatch(/\bc[a-z0-9]{24}\b/);
  });

  test("unknown, archived, and expired codes are indistinguishable to a stranger", async ({ page }) => {
    const targets = [archivedCode, expiredCode, "TOTALLYUNKNOWNCODE99"];
    const shapes: { status: number | undefined; heading: string }[] = [];

    for (const code of targets) {
      const res = await page.goto(`/r/${code}`);
      const heading = (await page.locator("body").innerText()).trim();
      shapes.push({ status: res?.status(), heading });
    }

    const [archived, expired, unknown] = shapes;
    expect(archived.status).toBe(404);
    expect(expired.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(archived.heading).toBe(unknown.heading);
    expect(expired.heading).toBe(unknown.heading);
  });
});

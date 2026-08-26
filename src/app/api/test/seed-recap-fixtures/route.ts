import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NORMAL_CODE = "RCPTEST1";
const ARCHIVED_CODE = "RCPTEST2";
const EXPIRED_CODE = "RCPTEST3";
// Kept in sync with the literal string tests/e2e/recap-safety.spec.ts asserts is absent from the page.
const RECAP_FIXTURE_PRIVATE_NOTE = "SECRET_INTERNAL_ONLY_do_not_leak_to_customer";

/**
 * Test-only fixture for the recap-safety permanent Playwright spec
 * (Recap-PR20). No UI anywhere lets a salesperson archive a Recap or set
 * an expiry, so the "probe a stranger's code" and private-field-leak
 * guards need a way to create those states directly. Gated identically
 * to /api/test/reset and /api/test/seed-second-tenant.
 */
export async function POST() {
  if (process.env.ALLOW_TEST_RESET !== "true") {
    return new NextResponse(null, { status: 404 });
  }

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return NextResponse.json({ error: "no-tenant" }, { status: 500 });

  await prisma.recap.deleteMany({ where: { code: { in: [NORMAL_CODE, ARCHIVED_CODE, EXPIRED_CODE] } } });

  const base = {
    tenantId: tenant.id,
    packId: "real-estate",
    customerNameSnapshot: "Fixture",
    customerStory: {},
    requirementsSnapshot: {},
    shortlistedProperties: [
      { itemId: "green-hills", order: 0, score: 80, reasons: [], priceAtCreation: 285000, currency: "USD", availabilityAtCreation: null },
    ],
    sectionVisibility: { shortlist: "show", customer: "show" },
  };

  await prisma.recap.create({
    data: { ...base, code: NORMAL_CODE, privateNotes: RECAP_FIXTURE_PRIVATE_NOTE },
  });
  await prisma.recap.create({
    data: { ...base, code: ARCHIVED_CODE, status: "Archived" },
  });
  await prisma.recap.create({
    data: { ...base, code: EXPIRED_CODE, expiresAt: new Date(Date.now() - 60_000) },
  });

  return NextResponse.json({ normalCode: NORMAL_CODE, archivedCode: ARCHIVED_CODE, expiredCode: EXPIRED_CODE });
}

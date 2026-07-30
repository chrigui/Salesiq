import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Playwright test-DB isolation. Real Postgres means state now persists
 * across tests, unlike the old localStorage-per-fresh-browser-context
 * guarantee — this route resets the mutable per-test data (leads,
 * sessions) so each test starts from the same seeded baseline. Gated on
 * ALLOW_TEST_RESET, never on NODE_ENV (Vercel preview deploys run with
 * NODE_ENV=production but must never expose this route).
 */
export async function POST() {
  if (process.env.ALLOW_TEST_RESET !== "true") {
    return new NextResponse(null, { status: 404 });
  }

  await prisma.lead.deleteMany({});
  await prisma.session.deleteMany({});

  return new NextResponse(null, { status: 204 });
}

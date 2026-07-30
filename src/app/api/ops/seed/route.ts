import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedDatabase } from "@/lib/seed-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A remote trigger for the same idempotent seed prisma/seed.ts runs locally
 * — for the deploy environments where running the CLI isn't practical (no
 * repo cloned, no local Node setup handy). Gated on SEED_TRIGGER_SECRET
 * being both set and matching; unset by default, so this route 404s (not
 * "403 exists but denied") until someone deliberately opts in. GET, not
 * POST, so it's triggerable by just visiting the URL — safe here because
 * every write underneath is an upsert (see seedDatabase), never destructive.
 */
export async function GET(request: NextRequest) {
  const configured = process.env.SEED_TRIGGER_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");

  if (!configured || !provided || !secretsMatch(configured, provided)) {
    return new NextResponse(null, { status: 404 });
  }

  const summary = await seedDatabase(prisma);
  return NextResponse.json({ ok: true, ...summary });
}

function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

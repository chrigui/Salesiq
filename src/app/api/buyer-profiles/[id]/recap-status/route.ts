import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { resolvePublicRecap } from "@/lib/recaps/resolve";
import { buildCreationSnapshot, computeRecapDiff, type RecapDiff } from "@/lib/recaps/diff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Salesperson-side property status-sync check (spec's "CUSTOMER'S
 * SHORTLISTED PROPERTY UPDATED" banner) — compares this buyer's most
 * recent Recap's live-resolved data against what was frozen at creation
 * time, reusing PR11's diff engine server-side rather than duplicating
 * price/availability comparison logic. Deliberately diffs against the
 * creation-time snapshot (buildCreationSnapshot), not
 * Recap.lastViewedSnapshot — a change must surface here even if the
 * customer has never opened their Recap at all.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const profile = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const latestRecap = await prisma.recap.findFirst({
      where: { buyerProfileId: id, tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });
    if (!latestRecap) return NextResponse.json({ diff: null, recapCode: null });

    const resolved = await resolvePublicRecap(latestRecap.code);
    if (!resolved) return NextResponse.json({ diff: null, recapCode: null });

    const diff: RecapDiff = computeRecapDiff(buildCreationSnapshot(resolved), resolved);
    return NextResponse.json({ diff, recapCode: resolved.code });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

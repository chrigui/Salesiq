import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { toBuyerProfileDTO } from "@/lib/serializers/buyerProfile";
import { compileSegmentWhere, matchesJsOnlyCriteria, type BuyerSegmentCriterion } from "@/core/buyerIntelligence/segments";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The drill-in list behind a segment's live count — same scope + criteria, actual rows. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const segment = await prisma.buyerSegment.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!segment) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const criteria = segment.criteria as unknown as BuyerSegmentCriterion[];
    const profiles = await prisma.buyerProfile.findMany({
      where: { AND: [buildBuyerProfileScope(ctx), compileSegmentWhere(criteria)] },
      orderBy: { lastInteractionAt: "desc" },
      take: 200,
      include: { assignedTo: { select: { name: true } } },
    });
    const matching = profiles.filter((p) =>
      matchesJsOnlyCriteria({ priorities: p.priorities as BuyerPriority[] | null }, criteria),
    );
    return NextResponse.json({ buyerProfiles: matching.map(toBuyerProfileDTO) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

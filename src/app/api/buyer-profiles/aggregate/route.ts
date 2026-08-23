import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { countSegmentMembers } from "@/lib/buyerProfiles/segmentCounts";
import type { BuyerSegmentCriterion } from "@/core/buyerIntelligence/segments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Wave 2 management aggregate view — the first genuine server-side
 * `groupBy`/`count` in this codebase (every other analytics surface is
 * client-side .filter()/.reduce() over a full record dump). Scoped via
 * buildBuyerProfileScope like every other Buyer Intelligence route: a
 * Salesperson gets a real branch/assigned-only rollup, Manager+ get the
 * tenant-wide picture — same numbers as the Buyers list would show, just
 * aggregated.
 */
export async function GET() {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const scope = buildBuyerProfileScope(ctx);

    const [intentGroups, readinessGroups, objectionGroups, segments, attentionRows, totalBuyers] = await Promise.all([
      prisma.buyerProfile.groupBy({
        by: ["intentLevel"],
        where: scope,
        // _count on the grouped-by field itself would only count non-null
        // occurrences, silently reporting 0 for the null ("unclassified")
        // group — _all counts every row in the group regardless.
        _count: { _all: true },
      }),
      prisma.buyerProfile.groupBy({
        by: ["purchaseReadiness"],
        where: scope,
        _count: { _all: true },
      }),
      prisma.buyerObjection.groupBy({
        by: ["kind"],
        where: { resolvedAt: null, buyerProfile: scope },
        // `kind` is a required (non-null) field, so counting it directly is
        // safe here — unlike intentLevel/purchaseReadiness above, there's
        // no null group to undercount.
        _count: { kind: true },
        orderBy: { _count: { kind: "desc" } },
        take: 5,
      }),
      prisma.buyerSegment.findMany({ where: { tenantId: ctx.tenantId }, select: { id: true, name: true, criteria: true } }),
      prisma.buyerProfile.findMany({
        where: { ...scope, objections: { some: { resolvedAt: null } } },
        select: {
          id: true,
          name: true,
          objections: { where: { resolvedAt: null }, orderBy: { createdAt: "desc" }, take: 1 },
        },
        take: 20,
      }),
      prisma.buyerProfile.count({ where: scope }),
    ]);

    const intentCounts = intentGroups.map((g) => ({
      level: g.intentLevel ?? "unclassified",
      count: g._count._all,
    }));
    const readinessCounts = readinessGroups.map((g) => ({
      stage: g.purchaseReadiness ?? "Unclassified",
      count: g._count._all,
    }));
    const topObjectionKinds = objectionGroups.map((g) => ({ kind: g.kind, count: g._count.kind }));

    const segmentSummary = await Promise.all(
      segments.map(async (s) => ({
        id: s.id,
        name: s.name,
        buyerCount: await countSegmentMembers(scope, s.criteria as unknown as BuyerSegmentCriterion[]),
      })),
    );

    const attention = attentionRows.map((b) => ({
      id: b.id,
      name: b.name,
      objectionKind: b.objections[0]?.kind ?? "",
      confidence: b.objections[0]?.confidence ?? "",
    }));

    return NextResponse.json({
      totalBuyers,
      intentCounts,
      readinessCounts,
      topObjectionKinds,
      segments: segmentSummary,
      attention,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

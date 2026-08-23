import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import {
  compileSegmentWhere,
  matchesJsOnlyCriteria,
  type BuyerSegmentCriterion,
} from "@/core/buyerIntelligence/segments";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const criterionSchema = z.object({
  field: z.enum(["intentLevel", "purchaseReadiness", "purpose", "priorityRequirement", "assignedToId", "branchId"]),
  value: z.string().min(1).max(200),
});

/**
 * A segment's buyer count is computed live on every read, never cached —
 * the whole point of a declarative segment is that it's always accurate.
 * `priorities` is selected alongside `id` only so `matchesJsOnlyCriteria`
 * can apply the one criterion type Postgres/Prisma can't express as a
 * `where` clause (see compileSegmentWhere) without a second round trip.
 */
async function countSegmentMembers(
  scope: ReturnType<typeof buildBuyerProfileScope>,
  criteria: BuyerSegmentCriterion[],
): Promise<number> {
  const rows = await prisma.buyerProfile.findMany({
    where: { AND: [scope, compileSegmentWhere(criteria)] },
    select: { id: true, priorities: true },
  });
  return rows.filter((r) => matchesJsOnlyCriteria({ priorities: r.priorities as BuyerPriority[] | null }, criteria))
    .length;
}

export async function GET() {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const segments = await prisma.buyerSegment.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    });
    const scope = buildBuyerProfileScope(ctx);
    const withCounts = await Promise.all(
      segments.map(async (s) => ({
        id: s.id,
        name: s.name,
        criteria: s.criteria as unknown as BuyerSegmentCriterion[],
        createdById: s.createdById,
        createdByName: s.createdBy?.name ?? null,
        createdAt: s.createdAt.getTime(),
        updatedAt: s.updatedAt.getTime(),
        buyerCount: await countSegmentMembers(scope, s.criteria as unknown as BuyerSegmentCriterion[]),
      })),
    );
    return NextResponse.json({ segments: withCounts });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  criteria: z.array(criterionSchema).min(1).max(20),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireCapability("buyer-intelligence.manage");
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const segment = await prisma.buyerSegment.create({
      data: {
        tenantId: ctx.tenantId,
        name: parsed.data.name,
        criteria: parsed.data.criteria,
        createdById: ctx.userId,
      },
    });
    return NextResponse.json({ id: segment.id });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

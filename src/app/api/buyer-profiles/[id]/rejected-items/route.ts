import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const profile = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const rejected = await prisma.buyerRejectedItem.findMany({ where: { buyerProfileId: id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({
      rejectedItems: rejected.map((r) => ({
        id: r.id,
        packId: r.packId,
        itemId: r.itemId,
        reason: r.reason,
        source: r.source,
        overriddenAt: r.overriddenAt?.getTime() ?? null,
        createdAt: r.createdAt.getTime(),
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const bodySchema = z.object({
  packId: z.string().min(1).max(100),
  itemId: z.string().min(1).max(200),
  reason: z.string().min(1).max(500),
});

/**
 * Deliberate reject action (distinct from the passive /activity write path) —
 * gated on buyer-intelligence.manage + branch/assignee scope, same as the
 * profile PATCH route. Upserts on the (buyerProfileId, packId, itemId)
 * uniqueness the schema already enforces: re-rejecting an item a salesperson
 * had previously overridden clears the override, since it's an active
 * decision again. Also appends a "rejected" BuyerItemRelationship event so
 * the item's full state history stays in one place.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.manage");
    const { id } = await params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const profile = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const { packId, itemId, reason } = parsed.data;
    const rejected = await prisma.buyerRejectedItem.upsert({
      where: { buyerProfileId_packId_itemId: { buyerProfileId: id, packId, itemId } },
      create: { buyerProfileId: id, tenantId: ctx.tenantId, packId, itemId, reason, source: "manual" },
      update: { reason, overriddenAt: null },
    });

    await prisma.buyerItemRelationship.create({
      data: { buyerProfileId: id, tenantId: ctx.tenantId, packId, itemId, state: "rejected", context: { reason } },
    });

    return NextResponse.json({ rejectedItemId: rejected.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

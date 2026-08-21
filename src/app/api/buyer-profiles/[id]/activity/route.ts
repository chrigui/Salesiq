import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireSession, requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { recomputeBuyerIntelligence } from "@/lib/buyerProfiles/recompute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const profile = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const [events, relationships] = await Promise.all([
      prisma.buyerActivityEvent.findMany({ where: { buyerProfileId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.buyerItemRelationship.findMany({ where: { buyerProfileId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
    ]);

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        kind: e.kind,
        packId: e.packId,
        itemId: e.itemId,
        meta: e.meta,
        createdAt: e.createdAt.getTime(),
      })),
      relationships: relationships.map((r) => ({
        id: r.id,
        packId: r.packId,
        itemId: r.itemId,
        state: r.state,
        context: r.context,
        createdAt: r.createdAt.getTime(),
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

/** Every activity kind the Companion is allowed to log, and the item-relationship state (if any) it also appends. */
const ACTIVITY_TO_RELATIONSHIP: Record<string, string> = {
  property_viewed: "viewed",
  item_saved: "saved",
  proposal_generated: "proposal_created",
};

const bodySchema = z.object({
  kind: z.enum(["property_viewed", "item_saved", "comparison_made", "proposal_generated"]),
  packId: z.string().max(100).optional(),
  itemId: z.string().max(200).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Session-authenticated, no capability gate — same ungated pattern as
 * /api/buyer-profiles/match: this is a passive byproduct of the salesperson's
 * own live Companion session (item focus, bookmark, proposal), not a
 * privileged edit. Only ever called from Companion-specific interaction
 * points (never from the shared session store itself), so the customer-
 * facing Display/Brochure/Shared-Experience surfaces never trigger a write.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireSession();
    const { id } = await params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const profile = await prisma.buyerProfile.findFirst({ where: { id, tenantId: ctx.tenantId }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const { kind, packId, itemId, meta } = parsed.data;

    await prisma.buyerActivityEvent.create({
      data: {
        buyerProfileId: id,
        tenantId: ctx.tenantId,
        kind,
        packId,
        itemId,
        meta: meta as Prisma.InputJsonValue | undefined,
      },
    });

    const relationshipState = ACTIVITY_TO_RELATIONSHIP[kind];
    if (relationshipState && packId && itemId) {
      await prisma.buyerItemRelationship.create({
        data: { buyerProfileId: id, tenantId: ctx.tenantId, packId, itemId, state: relationshipState },
      });
    }

    await prisma.buyerProfile.update({ where: { id }, data: { lastInteractionAt: new Date() } });
    await recomputeBuyerIntelligence(id);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

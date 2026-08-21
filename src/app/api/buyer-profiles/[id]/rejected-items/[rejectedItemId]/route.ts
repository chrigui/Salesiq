import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Override a rejection — the salesperson decides an item should resurface
 * for this buyer after all. Sets overriddenAt rather than deleting the row,
 * so the original reject reason stays visible in the record.
 */
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string; rejectedItemId: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.manage");
    const { id, rejectedItemId } = await params;

    const profile = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const existing = await prisma.buyerRejectedItem.findFirst({ where: { id: rejectedItemId, buyerProfileId: id } });
    if (!existing) return NextResponse.json({ error: "not-found" }, { status: 404 });

    await prisma.buyerRejectedItem.update({ where: { id: rejectedItemId }, data: { overriddenAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

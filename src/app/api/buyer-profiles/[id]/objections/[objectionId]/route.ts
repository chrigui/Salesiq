import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { recomputeBuyerIntelligence } from "@/lib/buyerProfiles/recompute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mark an objection resolved — a deliberate edit, gated the same as the profile PATCH route. */
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string; objectionId: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.manage");
    const { id, objectionId } = await params;

    const profile = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const existing = await prisma.buyerObjection.findFirst({ where: { id: objectionId, buyerProfileId: id } });
    if (!existing) return NextResponse.json({ error: "not-found" }, { status: 404 });

    await prisma.buyerObjection.update({ where: { id: objectionId }, data: { resolvedAt: new Date() } });
    await recomputeBuyerIntelligence(id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession, requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { classifyObjectionKind } from "@/core/buyerIntelligence/objections";
import { recomputeBuyerIntelligence } from "@/lib/buyerProfiles/recompute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const profile = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const objections = await prisma.buyerObjection.findMany({ where: { buyerProfileId: id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({
      objections: objections.map((o) => ({
        id: o.id,
        kind: o.kind,
        confidence: o.confidence,
        evidence: o.evidence,
        resolvedAt: o.resolvedAt?.getTime() ?? null,
        createdAt: o.createdAt.getTime(),
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const bodySchema = z.object({ rawText: z.string().min(1).max(1000) });

/**
 * Session-authenticated, no capability gate — same ungated pattern as
 * /activity: an objection logged mid-conversation via the Objection Handler
 * is a byproduct of the salesperson's own live linked session, not a
 * privileged edit. A second objection of the same kind is recorded at
 * "high" confidence rather than "medium" — a real repeated-pushback signal,
 * not a guess. Scoped with buildBuyerProfileScope, same reasoning as
 * /activity: a Salesperson can log objections only for their own
 * branch/assigned buyers.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireSession();
    const { id } = await params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const profile = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const rawText = parsed.data.rawText.trim();
    const kind = classifyObjectionKind(rawText);
    const priorCount = await prisma.buyerObjection.count({ where: { buyerProfileId: id, kind } });

    const objection = await prisma.buyerObjection.create({
      data: {
        buyerProfileId: id,
        tenantId: ctx.tenantId,
        kind,
        confidence: priorCount >= 1 ? "high" : "medium",
        evidence: [rawText],
      },
    });
    await recomputeBuyerIntelligence(id);

    return NextResponse.json({ objectionId: objection.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

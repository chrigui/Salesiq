import { NextResponse } from "next/server";
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

    const changes = await prisma.buyerRequirementChange.findMany({
      where: { buyerProfileId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({
      changes: changes.map((c) => ({
        id: c.id,
        field: c.field,
        previousValue: c.previousValue,
        newValue: c.newValue,
        source: c.source,
        createdAt: c.createdAt.getTime(),
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

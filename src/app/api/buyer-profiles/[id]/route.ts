import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toBuyerProfileDTO } from "@/lib/serializers/buyerProfile";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const profile = await prisma.buyerProfile.findFirst({
      where: { id, ...buildBuyerProfileScope(ctx) },
      include: { assignedTo: { select: { name: true } } },
    });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ buyerProfile: toBuyerProfileDTO(profile) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

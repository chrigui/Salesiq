import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toBuyerProfileDTO } from "@/lib/serializers/buyerProfile";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const profiles = await prisma.buyerProfile.findMany({
      where: buildBuyerProfileScope(ctx),
      orderBy: { lastInteractionAt: "desc" },
      take: 200,
      include: { assignedTo: { select: { name: true } } },
    });
    return NextResponse.json({ buyerProfiles: profiles.map(toBuyerProfileDTO) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

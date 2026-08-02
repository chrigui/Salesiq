import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { summarizeBrochureEvents } from "@/lib/serializers/brochure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("brochures.manage");
    const { id } = await params;
    const brochure = await prisma.brochure.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!brochure) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const events = await prisma.brochureEvent.findMany({
      where: { brochureId: id },
      orderBy: { createdAt: "asc" },
      take: 5000,
    });
    return NextResponse.json({ analytics: summarizeBrochureEvents(events) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

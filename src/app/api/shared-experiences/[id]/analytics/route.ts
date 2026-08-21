import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, AuthError } from "@/lib/auth/server";
import { summarizeSharedExperienceEvents } from "@/lib/serializers/sharedExperience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Session-authenticated, own-tenant only — same ungated-by-capability pattern as creating a share; a salesperson can see analytics for shares in their own tenant. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireSession();
    const { id } = await params;
    const sharedExperience = await prisma.sharedExperience.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!sharedExperience) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const events = await prisma.sharedExperienceEvent.findMany({
      where: { sharedExperienceId: id },
      orderBy: { createdAt: "asc" },
      take: 5000,
    });
    return NextResponse.json({ analytics: summarizeSharedExperienceEvents(events) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

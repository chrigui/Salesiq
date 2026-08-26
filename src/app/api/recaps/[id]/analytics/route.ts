import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { emptyRecapEventCounts, deriveRecapEngagement, type RecapEventCounts } from "@/lib/recaps/signals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Owner-scoped via the recaps.view capability (unlike creating a Recap,
 * which is an ungated byproduct of a salesperson's own live session — see
 * POST /api/recaps — reading another salesperson's customer engagement
 * data is a privileged view, gated the same way Buyer Intelligence gates
 * its own profile reads). Tenant-scoped, not creator-scoped, so anyone
 * with the capability can see engagement on any Recap in their tenant.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("recaps.view");
    const { id } = await params;
    const recap = await prisma.recap.findFirst({ where: { id, tenantId: ctx.tenantId }, select: { id: true } });
    if (!recap) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const grouped = await prisma.recapEvent.groupBy({
      by: ["kind"],
      where: { recapId: id },
      _count: { _all: true },
    });

    const counts = emptyRecapEventCounts();
    for (const row of grouped) {
      counts[row.kind as keyof RecapEventCounts] = row._count._all;
    }

    return NextResponse.json({ analytics: { counts, engagement: deriveRecapEngagement(counts) } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

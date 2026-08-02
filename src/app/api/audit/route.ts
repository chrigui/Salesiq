import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The first real, DB-backed audit read path (see src/lib/audit.ts) — scoped
 * to brochure actions for now via ?target=, not a platform-wide audit
 * overhaul. `target` here means "the id being acted on" (a brochure id),
 * matching what src/lib/audit.ts's logTenantAudit writes.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireCapability("security.manage");
    const target = new URL(request.url).searchParams.get("target");
    const entries = await prisma.tenantAuditEntry.findMany({
      where: { tenantId: ctx.tenantId, ...(target ? { target } : {}) },
      orderBy: { ts: "desc" },
      take: 200,
    });
    return NextResponse.json({
      entries: entries.map((e) => ({ ...e, ts: e.ts.getTime() })),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

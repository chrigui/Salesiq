import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, getSessionContext, AuthError } from "@/lib/auth/server";
import { getDefaultTenant } from "@/lib/auth/tenant";
import { toLeadDTO } from "@/lib/serializers/lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await requireCapability("leads.view");
    const leads = await prisma.lead.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ leads: leads.map(toLeadDTO) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const createSchema = z.object({
  name: z.string().max(200),
  phone: z.string().max(50),
  email: z.string().max(200),
  notes: z.string().max(2000),
  packId: z.string().min(1).max(100),
  packLabel: z.string().max(200),
  itemName: z.string().max(200),
  price: z.number().min(0).max(1_000_000_000),
  currency: z.string().length(3),
  score: z.number().min(0).max(100),
});

/**
 * SECURITY: this route is deliberately reachable without a session — the
 * companion (where a live sales session becomes a lead) has no login of
 * its own today. When no session cookie is present, the lead is written
 * against DEFAULT_TENANT_SLUG with createdById: null and source flagged
 * "companion-anon", so it stays auditable. This is a known, deliberate
 * tradeoff (see the migration plan's "companion tenant problem"), not an
 * oversight — gating /companion behind login is the natural follow-up.
 * middleware.ts carries a matching exception for exactly this path+method.
 */
export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }

  try {
    const ctx = await getSessionContext();
    const tenant = ctx ? { id: ctx.tenantId } : await getDefaultTenant();

    const lead = await prisma.lead.create({
      data: {
        ...parsed.data,
        tenantId: tenant.id,
        branchId: ctx?.branchId ?? null,
        createdById: ctx?.userId ?? null,
        source: ctx ? "dashboard" : "companion-anon",
      },
    });

    return NextResponse.json({ lead: toLeadDTO(lead) }, { status: 201 });
  } catch (err) {
    // Unlike every other route here, this one has no session to blame a
    // failure on (it's deliberately reachable anonymously — see the
    // SECURITY comment above) — getDefaultTenant() or the DB write itself
    // can throw for reasons a generic 500 would otherwise hide completely.
    // Logged here so it's visible in the deployment's function logs.
    console.error("POST /api/leads failed:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}

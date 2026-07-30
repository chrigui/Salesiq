import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession, requireCapability, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["Owner", "Admin", "Manager", "Salesperson", "Viewer"] as const;

const matrixSchema = z.record(
  z.enum(ROLES),
  z.record(z.string(), z.boolean()),
);

/**
 * Readable by any authenticated session — not just users.manage — because
 * can() (core/data/permissions.ts) drives nav filtering for every role, not
 * only the Permissions settings screen. Only PUT (editing) is gated.
 */
export async function GET() {
  try {
    const ctx = await requireSession();
    const rows = await prisma.rolePermission.findMany({ where: { tenantId: ctx.tenantId } });

    const matrix: Record<string, Record<string, boolean>> = {};
    for (const role of ROLES) matrix[role] = {};
    for (const row of rows) matrix[row.role][row.capabilityId] = row.granted;

    return NextResponse.json({ matrix });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await requireCapability("users.manage");
    const parsed = matrixSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const writes = Object.entries(parsed.data).flatMap(([role, caps]) =>
      Object.entries(caps ?? {}).map(([capabilityId, granted]) =>
        prisma.rolePermission.upsert({
          where: { tenantId_role_capabilityId: { tenantId: ctx.tenantId, role: role as (typeof ROLES)[number], capabilityId } },
          // Owner is always fully granted — the no-lockout guarantee — even
          // if a client somehow submits Owner:false, this stays true.
          update: { granted: role === "Owner" ? true : granted },
          create: { tenantId: ctx.tenantId, role: role as (typeof ROLES)[number], capabilityId, granted: role === "Owner" ? true : granted },
        }),
      ),
    );
    await prisma.$transaction(writes);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

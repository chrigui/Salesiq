import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toDisplayDTO } from "@/lib/serializers/display";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.view");
    const { id } = await params;
    const display = await prisma.display.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!display) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ display: toDisplayDTO(display) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  branchId: z.string().min(1).max(100).nullable().optional(),
  idleProfileId: z.string().min(1).max(100).nullable().optional(),
  liveProfileId: z.string().min(1).max(100).nullable().optional(),
  status: z.enum(["Pending", "Active", "Archived"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const { branchId, idleProfileId, liveProfileId, ...rest } = parsed.data;

    // Any tenant-scoped FK the client supplies must actually belong to this
    // tenant — a bare `updateMany` on Display alone can't enforce that.
    if (branchId) {
      const branch = await prisma.branch.findFirst({ where: { id: branchId, tenantId: ctx.tenantId }, select: { id: true } });
      if (!branch) return NextResponse.json({ error: "unknown-branch" }, { status: 404 });
    }
    for (const profileId of [idleProfileId, liveProfileId]) {
      if (!profileId) continue;
      const profile = await prisma.displayProfile.findFirst({ where: { id: profileId, tenantId: ctx.tenantId }, select: { id: true } });
      if (!profile) return NextResponse.json({ error: "unknown-profile" }, { status: 404 });
    }

    const result = await prisma.display.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: {
        ...rest,
        ...(branchId !== undefined ? { branchId } : {}),
        ...(idleProfileId !== undefined ? { idleProfileId } : {}),
        ...(liveProfileId !== undefined ? { liveProfileId } : {}),
      },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "display.updated",
      target: id,
      detail: "Updated display configuration",
    });

    const display = await prisma.display.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ display: toDisplayDTO(display) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

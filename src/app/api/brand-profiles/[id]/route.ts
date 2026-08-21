import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toBrandProfileDTO } from "@/lib/serializers/brandProfile";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  brand: z.string().max(20).nullable().optional(),
  brandSoft: z.string().max(20).nullable().optional(),
  logoGlyph: z.string().max(10).nullable().optional(),
  fontHeading: z.string().max(100).nullable().optional(),
  fontBody: z.string().max(100).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const result = await prisma.brandProfile.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: parsed.data,
    });
    if (result.count === 0) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const brandProfile = await prisma.brandProfile.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ brandProfile: toBrandProfileDTO(brandProfile) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const { id } = await params;

    // Detach any profiles still pointing at this brand kit before deleting
    // it — onDelete: SetNull on the FK would do this at the DB level too,
    // but doing it explicitly here keeps the audit trail honest about what
    // actually happened, and works even if the FK constraint changes later.
    await prisma.displayProfile.updateMany({
      where: { brandProfileId: id, tenantId: ctx.tenantId },
      data: { brandProfileId: null },
    });

    const result = await prisma.brandProfile.deleteMany({ where: { id, tenantId: ctx.tenantId } });
    if (result.count === 0) return NextResponse.json({ error: "not-found" }, { status: 404 });

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "brand-profile.deleted",
      target: id,
      detail: "Deleted a brand profile",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

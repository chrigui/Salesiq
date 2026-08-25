import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toDisplayProfileDTO } from "@/lib/serializers/displayProfile";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Copies a profile's editable configuration into a fresh Draft row with no
 * publish history of its own — modifying the copy (or publishing it) can
 * never reach back and affect the original, matching the "duplicate, then
 * customize per client/listing" workflow the spec asks for. Assets
 * (uploaded images/documents) are intentionally not copied — they're binary
 * blobs tied to the original row, not lightweight config.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const { id } = await params;

    const source = await prisma.displayProfile.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!source) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const copy = await prisma.displayProfile.create({
      data: {
        tenantId: ctx.tenantId,
        packId: source.packId,
        itemId: source.itemId,
        name: `${source.name} (Copy)`,
        template: source.template,
        layout: source.layout,
        brandProfileId: source.brandProfileId,
        brandOverrides: (source.brandOverrides ?? undefined) as Prisma.InputJsonValue | undefined,
        sections: source.sections as unknown as Prisma.InputJsonValue,
        motion: source.motion as unknown as Prisma.InputJsonValue,
        idle: (source.idle ?? undefined) as Prisma.InputJsonValue | undefined,
        status: "Draft",
        createdById: ctx.userId,
      },
    });

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "display-profile.duplicated",
      target: copy.id,
      detail: `Duplicated "${source.name}" into a new draft`,
    });

    return NextResponse.json({ profile: toDisplayProfileDTO(copy) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

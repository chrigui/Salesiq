import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, serverCan, AuthError } from "@/lib/auth/server";
import { toDisplayProfileDTO } from "@/lib/serializers/displayProfile";
import { publishDisplayProfileVersion } from "@/lib/displayProfiles/publish";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Revert clones an old version's frozen content into the live draft, then
 * immediately re-publishes — which creates a brand-new version rather than
 * resurrecting or mutating the old row. History stays append-only: "went
 * back to v1" shows up as a real v4, not a rewritten past.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    if (!(await serverCan(ctx.tenantId, ctx.role, "display-studio.publish"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id, versionId } = await params;

    const target = await prisma.displayProfileVersion.findFirst({
      where: { id: versionId, profileId: id, tenantId: ctx.tenantId },
    });
    if (!target) return NextResponse.json({ error: "not-found" }, { status: 404 });

    await prisma.displayProfile.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: {
        sections: target.sections ?? undefined,
        motion: target.motion ?? undefined,
        idle: target.idle ?? undefined,
      },
    });

    await publishDisplayProfileVersion({
      tenantId: ctx.tenantId,
      profileId: id,
      authorId: ctx.userId,
      changeReason: `Reverted to v${target.version}`,
    });

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "display-profile.reverted",
      target: id,
      detail: `Reverted to version ${target.version}`,
    });

    const profile = await prisma.displayProfile.findUniqueOrThrow({
      where: { id },
      include: { brandProfile: true, assets: { select: { id: true, name: true, mimeType: true, sizeBytes: true } } },
    });
    return NextResponse.json({ profile: toDisplayProfileDTO(profile) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

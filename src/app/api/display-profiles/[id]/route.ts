import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireCapability, serverCan, AuthError } from "@/lib/auth/server";
import { toDisplayProfileDTO } from "@/lib/serializers/displayProfile";
import { publishDisplayProfileVersion } from "@/lib/displayProfiles/publish";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.view");
    const { id } = await params;
    const profile = await prisma.displayProfile.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { brandProfile: true, assets: { select: { id: true, name: true, mimeType: true, sizeBytes: true } } },
    });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ profile: toDisplayProfileDTO(profile) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const sectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  enabled: z.boolean(),
  order: z.number(),
  config: z.record(z.string(), z.unknown()).optional(),
});

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  template: z
    .enum(["Minimal", "NewDevelopment", "Detailed", "Lifestyle", "Investment", "LuxuryCinematic", "Masterplan", "Custom"])
    .optional(),
  sections: z.array(sectionSchema).optional(),
  brandProfileId: z.string().min(1).max(100).nullable().optional(),
  brandOverrides: z.object({ brand: z.string().optional(), brandSoft: z.string().optional() }).nullable().optional(),
  status: z.enum(["Draft", "Published", "Archived"]).optional(),
  changeReason: z.string().max(500).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const { status, brandProfileId, changeReason, ...rest } = parsed.data;

    if (brandProfileId) {
      const brandProfile = await prisma.brandProfile.findFirst({
        where: { id: brandProfileId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!brandProfile) return NextResponse.json({ error: "unknown-brand-profile" }, { status: 404 });
    }

    // Publishing (or reverting a Published profile to Draft/Archived) is a
    // step beyond ordinary editing — Designer, for example, holds .manage
    // but not .publish, so their edits stay drafts until someone who can
    // publish reviews them.
    if (status !== undefined && !(await serverCan(ctx.tenantId, ctx.role, "display-studio.publish"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ordinary field edits (name/template/sections/brand) always apply
    // first, so a "Publish" request that also carries fresh edits snapshots
    // the version off the just-updated draft, not a stale one.
    const fieldResult = await prisma.displayProfile.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: {
        ...(rest as unknown as Prisma.DisplayProfileUpdateManyMutationInput),
        ...(brandProfileId !== undefined ? { brandProfileId } : {}),
      },
    });
    if (fieldResult.count === 0) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    if (status === "Published") {
      await publishDisplayProfileVersion({ tenantId: ctx.tenantId, profileId: id, authorId: ctx.userId, changeReason });
      await logTenantAudit({
        tenantId: ctx.tenantId,
        actor: ctx.name,
        action: "display-profile.published",
        target: id,
        detail: changeReason ? `Published a new version: ${changeReason}` : "Published a new version",
      });
    } else if (status !== undefined) {
      await prisma.displayProfile.updateMany({
        where: { id, tenantId: ctx.tenantId },
        data: { status, publishedAt: undefined },
      });
      await logTenantAudit({
        tenantId: ctx.tenantId,
        actor: ctx.name,
        action: `display-profile.${status.toLowerCase()}`,
        target: id,
        detail: `Set Display Studio profile status to ${status}`,
      });
    }

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

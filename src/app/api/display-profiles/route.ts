import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { PACKS_BY_ID, getBasePack } from "@/core/industries";
import { toDisplayProfileDTO } from "@/lib/serializers/displayProfile";
import { defaultDisplaySections } from "@/lib/displayProfiles/sections";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await requireCapability("display-studio.view");
    const profiles = await prisma.displayProfile.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ profiles: profiles.map(toDisplayProfileDTO) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const createSchema = z.object({
  packId: z.string().min(1).max(100),
  itemId: z.string().min(1).max(100),
  name: z.string().min(1).max(200).optional(),
  template: z
    .enum(["Minimal", "NewDevelopment", "Detailed", "Lifestyle", "Investment", "LuxuryCinematic", "Masterplan", "Custom"])
    .default("Minimal"),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const { packId, itemId, name, template } = parsed.data;

    if (!PACKS_BY_ID[packId]) {
      return NextResponse.json({ error: "unknown-pack" }, { status: 404 });
    }
    const item = getBasePack(packId).inventory.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: "unknown-item" }, { status: 404 });
    }

    const profile = await prisma.displayProfile.create({
      data: {
        tenantId: ctx.tenantId,
        packId,
        itemId,
        name: name?.trim() || `${item.name} display`,
        template,
        sections: defaultDisplaySections() as unknown as Prisma.InputJsonValue,
        status: "Draft",
        createdById: ctx.userId,
      },
    });

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "display-profile.created",
      target: profile.id,
      detail: `Created a Display Studio profile for ${item.name}`,
    });

    return NextResponse.json({ profile: toDisplayProfileDTO(profile) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

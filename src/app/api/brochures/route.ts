import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { PACKS_BY_ID, getBasePack } from "@/core/industries";
import { toBrochureDTO } from "@/lib/serializers/brochure";
import { generateUniqueBrochureSlug } from "@/lib/brochures/slug";
import { defaultSections } from "@/lib/brochures/sections";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await requireCapability("brochures.manage");
    const brochures = await prisma.brochure.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ brochures: brochures.map(toBrochureDTO) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const createSchema = z.object({
  packId: z.string().min(1).max(100),
  itemId: z.string().min(1).max(100),
  template: z.enum(["Modern", "Luxury", "Minimal"]).default("Modern"),
  theme: z.enum(["Light", "Dark", "Auto", "Brand"]).default("Light"),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireCapability("brochures.manage");
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const { packId, itemId, template, theme } = parsed.data;

    if (!PACKS_BY_ID[packId]) {
      return NextResponse.json({ error: "unknown-pack" }, { status: 404 });
    }
    const item = getBasePack(packId).inventory.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: "unknown-item" }, { status: 404 });
    }

    const slug = await generateUniqueBrochureSlug();
    const brochure = await prisma.brochure.create({
      data: {
        tenantId: ctx.tenantId,
        packId,
        itemId,
        slug,
        template,
        theme,
        sections: defaultSections() as unknown as Prisma.InputJsonValue,
        status: "Draft",
        createdById: ctx.userId,
      },
    });

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "brochure.created",
      target: brochure.id,
      detail: `Generated a brochure for ${item.name}`,
    });

    return NextResponse.json({ brochure: toBrochureDTO(brochure) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

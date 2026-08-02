import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toBrochureDTO } from "@/lib/serializers/brochure";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("brochures.manage");
    const { id } = await params;
    const brochure = await prisma.brochure.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!brochure) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ brochure: toBrochureDTO(brochure) });
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
  template: z.enum(["Modern", "Luxury", "Minimal"]).optional(),
  theme: z.enum(["Light", "Dark", "Auto", "Brand"]).optional(),
  sections: z.array(sectionSchema).optional(),
  brandingOverrides: z.record(z.string(), z.unknown()).nullable().optional(),
  status: z.enum(["Draft", "Published", "Archived"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("brochures.manage");
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const { status, ...rest } = parsed.data;

    const result = await prisma.brochure.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: {
        ...(rest as unknown as Prisma.BrochureUpdateManyMutationInput),
        ...(status !== undefined
          ? { status, publishedAt: status === "Published" ? new Date() : undefined }
          : {}),
      },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    if (status !== undefined) {
      await logTenantAudit({
        tenantId: ctx.tenantId,
        actor: ctx.name,
        action: `brochure.${status.toLowerCase()}`,
        target: id,
        detail: `Set brochure status to ${status}`,
      });
    }

    const brochure = await prisma.brochure.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ brochure: toBrochureDTO(brochure) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

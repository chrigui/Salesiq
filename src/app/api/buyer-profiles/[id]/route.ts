import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toBuyerProfileDTO } from "@/lib/serializers/buyerProfile";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { applyBuyerProfileFieldUpdate } from "@/lib/buyerProfiles/applyUpdates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const profile = await prisma.buyerProfile.findFirst({
      where: { id, ...buildBuyerProfileScope(ctx) },
      include: { assignedTo: { select: { name: true } } },
    });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ buyerProfile: toBuyerProfileDTO(profile) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const buyerFieldSchema = z.object({
  value: z.unknown(),
  provenance: z.enum(["explicit", "inferred", "observed"]),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  evidence: z.array(z.string()).optional(),
  updatedAt: z.number(),
});

const patchSchema = z.object({
  requirements: z.record(z.string(), buyerFieldSchema).nullable().optional(),
  financial: z.record(z.string(), buyerFieldSchema).nullable().optional(),
  purposes: z.array(z.string()).optional(),
  motivations: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        tier: z.enum(["primary", "secondary"]),
        evidence: z.array(z.string()),
      }),
    )
    .nullable()
    .optional(),
  priorities: z
    .array(
      z.object({
        requirement: z.string(),
        questionId: z.string().nullable().optional(),
        importance: z.enum(["must", "important", "preferred", "nice", "not_important"]),
      }),
    )
    .nullable()
    .optional(),
});

/**
 * Edits a buyer's explicit/inferred/observed-tagged fields — gated on
 * buyer-intelligence.manage AND the same branch/assignee scope GET enforces
 * (a Salesperson holds .manage but still shouldn't edit an arbitrary
 * tenant-wide profile). requirements/financial changes that overwrite a
 * previously-set value are recorded as BuyerRequirementChange rows first —
 * never silently overwritten (spec §12).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.manage");
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const existing = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) } });
    if (!existing) return NextResponse.json({ error: "not-found" }, { status: 404 });

    await applyBuyerProfileFieldUpdate({
      buyerProfileId: id,
      tenantId: ctx.tenantId,
      existing,
      update: parsed.data,
      source: "manual",
    });

    const profile = await prisma.buyerProfile.findUniqueOrThrow({
      where: { id },
      include: { assignedTo: { select: { name: true } } },
    });
    return NextResponse.json({ buyerProfile: toBuyerProfileDTO(profile) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

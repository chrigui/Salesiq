import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { applyBuyerProfileFieldUpdate } from "@/lib/buyerProfiles/applyUpdates";
import { ALLOWED_PURPOSES } from "@/core/buyerIntelligence/conversationExtraction";
import { explicitField, type BuyerField } from "@/core/buyerIntelligence/types";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const profile = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const notes = await prisma.buyerConversationNote.findMany({
      where: { buyerProfileId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { createdBy: { select: { name: true } } },
    });
    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        rawText: n.rawText,
        extracted: n.extracted,
        status: n.status,
        confirmedFields: n.confirmedFields,
        createdByName: n.createdBy?.name ?? null,
        createdAt: n.createdAt.getTime(),
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const extractionSchema = z.object({
  familySize: z.number().optional(),
  propertyType: z.string().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  budget: z.string().optional(),
  preferredLocation: z.string().optional(),
  purposes: z.array(z.string()).optional(),
  priorityLabel: z.string().optional(),
  secondaryLabel: z.string().optional(),
});

const bodySchema = z.object({
  rawText: z.string().max(4000),
  extracted: extractionSchema,
  status: z.enum(["confirmed", "edited", "rejected"]),
  // Only present for confirmed/edited — the (possibly hand-edited) fields to actually apply.
  confirmedFields: extractionSchema.optional(),
});

/**
 * CONFIRM/EDIT/REJECT for a natural-language "describe the customer" capture
 * (spec §10) — the extraction route only ever proposes; this is the one
 * place anything from it is trusted onto a BuyerProfile, and only for
 * confirmed/edited notes. A rejected note is still recorded (for audit) but
 * writes nothing to the profile.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.manage");
    const { id } = await params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const existing = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) } });
    if (!existing) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const { rawText, extracted, status } = parsed.data;
    const fields = status === "rejected" ? undefined : (parsed.data.confirmedFields ?? extracted);

    if (fields) {
      const requirements: Record<string, BuyerField<unknown>> = {
        ...((existing.requirements as unknown as Record<string, BuyerField<unknown>>) ?? {}),
      };
      const financial: Record<string, BuyerField<unknown>> = {
        ...((existing.financial as unknown as Record<string, BuyerField<unknown>>) ?? {}),
      };
      const evidence = [`From: "${rawText.slice(0, 200)}"`];

      if (fields.familySize != null) requirements["Family size"] = explicitField(String(fields.familySize), evidence);
      if (fields.propertyType) requirements["Property type"] = explicitField(fields.propertyType, evidence);
      if (fields.bedrooms != null) requirements["Bedrooms"] = explicitField(String(fields.bedrooms), evidence);
      if (fields.bathrooms != null) requirements["Bathrooms"] = explicitField(String(fields.bathrooms), evidence);
      if (fields.preferredLocation) requirements["Preferred location"] = explicitField(fields.preferredLocation, evidence);
      if (fields.budget) financial["Budget range"] = explicitField(fields.budget, evidence);

      const purposes = fields.purposes?.filter((p) => ALLOWED_PURPOSES.includes(p)) ?? [];
      const nextPurposes = purposes.length > 0 ? [...new Set([...existing.purposes, ...purposes])] : undefined;

      const priorities: BuyerPriority[] = [...((existing.priorities as BuyerPriority[] | null) ?? [])];
      if (fields.priorityLabel && !priorities.some((p) => p.requirement === fields.priorityLabel)) {
        priorities.push({ requirement: fields.priorityLabel, questionId: null, importance: "important" });
      }
      if (fields.secondaryLabel && !priorities.some((p) => p.requirement === fields.secondaryLabel)) {
        priorities.push({ requirement: fields.secondaryLabel, questionId: null, importance: "preferred" });
      }

      await applyBuyerProfileFieldUpdate({
        buyerProfileId: id,
        tenantId: ctx.tenantId,
        existing,
        update: {
          requirements,
          financial,
          ...(nextPurposes ? { purposes: nextPurposes } : {}),
          ...(priorities.length > 0 ? { priorities } : {}),
        },
        source: "sales-conversation",
      });
    }

    const note = await prisma.buyerConversationNote.create({
      data: {
        buyerProfileId: id,
        tenantId: ctx.tenantId,
        rawText,
        extracted: extracted as unknown as Prisma.InputJsonValue,
        status,
        confirmedFields: fields ? (fields as unknown as Prisma.InputJsonValue) : undefined,
        createdById: ctx.userId,
      },
    });

    return NextResponse.json({ noteId: note.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

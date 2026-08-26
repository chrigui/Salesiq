import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireSession, AuthError } from "@/lib/auth/server";
import { PACKS_BY_ID } from "@/core/industries";
import type { Answers } from "@/core/types";
import { scoreInventory } from "@/core/engine/scoring";
import { buildRecapSnapshot } from "@/lib/recaps/buildSnapshot";
import { generateUniqueRecapCode } from "@/lib/recaps/code";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { toRecapDTO, defaultSectionVisibility } from "@/lib/serializers/recap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const salespersonMessageSchema = z.object({
  templateKind: z.enum(["ThankYou", "FollowUp", "Personal"]),
  text: z.string().max(2000),
  advisorPhone: z.string().max(50).optional(),
});

const createSchema = z.object({
  packId: z.string().min(1).max(100),
  answers: z.record(z.string(), z.unknown()),
  shortlistItemIds: z.array(z.string().min(1).max(100)).min(1).max(20),
  compareItemIds: z.array(z.string().min(1).max(100)).max(10).optional(),
  finalRecommendationItemId: z.string().min(1).max(100).nullable().optional(),
  customerName: z.string().max(200).nullable().optional(),
  buyerProfileId: z.string().min(1).max(100).nullable().optional(),
  customerStory: z.record(z.string(), z.unknown()).optional(),
  salespersonMessage: salespersonMessageSchema.nullable().optional(),
  nextSteps: z.array(z.string().max(50)).max(10).optional(),
  sectionVisibility: z.record(z.string(), z.enum(["show", "hide"])).optional(),
  privateNotes: z.string().max(5000).nullable().optional(),
  brandProfileId: z.string().min(1).max(100).nullable().optional(),
});

/**
 * Session-authenticated, no capability gate — same ungated pattern as
 * /api/shared-experiences: any logged-in salesperson can turn their own
 * live Companion session into a recap. Scoring is recomputed server-side
 * from the submitted packId/answers (scoreInventory is deterministic and
 * pure), never trusted from the client, so a recap's frozen reasons always
 * trace back to the real rule engine. Item ids are validated against the
 * real shipped pack, same as shared-experiences' route.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireSession();
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const {
      packId,
      answers,
      shortlistItemIds,
      compareItemIds,
      finalRecommendationItemId,
      customerName,
      buyerProfileId,
      customerStory,
      salespersonMessage,
      nextSteps,
      sectionVisibility,
      privateNotes,
      brandProfileId,
    } = parsed.data;

    const pack = PACKS_BY_ID[packId];
    if (!pack) return NextResponse.json({ error: "unknown-pack" }, { status: 404 });

    const validShortlistItemIds = shortlistItemIds.filter((id) => pack.inventory.some((i) => i.id === id));
    if (validShortlistItemIds.length === 0) {
      return NextResponse.json({ error: "unknown-items" }, { status: 404 });
    }
    const validCompareItemIds = compareItemIds?.filter((id) => pack.inventory.some((i) => i.id === id));

    if (buyerProfileId) {
      const buyerProfile = await prisma.buyerProfile.findFirst({
        where: { id: buyerProfileId, ...buildBuyerProfileScope(ctx) },
        select: { id: true },
      });
      if (!buyerProfile) return NextResponse.json({ error: "unknown-buyer-profile" }, { status: 404 });
    }

    if (brandProfileId) {
      const brandProfile = await prisma.brandProfile.findFirst({
        where: { id: brandProfileId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!brandProfile) return NextResponse.json({ error: "unknown-brand-profile" }, { status: 404 });
    }

    const typedAnswers = answers as unknown as Answers;
    const scored = scoreInventory(pack, typedAnswers);
    const snapshot = buildRecapSnapshot({
      pack,
      answers: typedAnswers,
      scored,
      shortlistItemIds: validShortlistItemIds,
      compareItemIds: validCompareItemIds,
      customerName: customerName ?? undefined,
      finalRecommendationItemId:
        finalRecommendationItemId !== undefined
          ? finalRecommendationItemId && validShortlistItemIds.includes(finalRecommendationItemId)
            ? finalRecommendationItemId
            : null
          : undefined,
    });

    const code = await generateUniqueRecapCode();
    const recap = await prisma.recap.create({
      data: {
        tenantId: ctx.tenantId,
        code,
        packId,
        buyerProfileId: buyerProfileId ?? null,
        createdById: ctx.userId,
        customerNameSnapshot: snapshot.customerNameSnapshot,
        customerStory: (customerStory ?? {}) as Prisma.InputJsonValue,
        requirementsSnapshot: snapshot.requirementsSnapshot as Prisma.InputJsonValue,
        shortlistedProperties: snapshot.shortlistedProperties as unknown as Prisma.InputJsonValue,
        comparedProperties: (snapshot.comparedProperties as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        finalRecommendationItemId: snapshot.finalRecommendationItemId,
        salespersonMessage: (salespersonMessage as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        nextSteps: (nextSteps as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        sectionVisibility: (sectionVisibility ?? defaultSectionVisibility()) as Prisma.InputJsonValue,
        privateNotes: privateNotes?.trim() || null,
        brandProfileId: brandProfileId ?? null,
      },
    });

    return NextResponse.json({ recap: toRecapDTO(recap) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

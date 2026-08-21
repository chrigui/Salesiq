import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireSession, AuthError } from "@/lib/auth/server";
import { PACKS_BY_ID } from "@/core/industries";
import { generateUniqueShareCode } from "@/lib/sharedExperiences/code";
import { toSharedExperienceDTO } from "@/lib/serializers/sharedExperience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  packId: z.string().min(1).max(100),
  itemIds: z.array(z.string().min(1).max(100)).min(1).max(50),
  focusedItemId: z.string().min(1).max(100).nullable().optional(),
  proposalText: z.string().max(20_000).nullable().optional(),
  proposalEngine: z.string().max(100).nullable().optional(),
  customerName: z.string().max(200).nullable().optional(),
});

/**
 * Session-authenticated, no capability gate — same ungated pattern as the
 * rest of the live Companion experience (presenting on the Display, saving a
 * lead). Any logged-in salesperson can share their own session; there's
 * nothing tenant-privileged about it. Item ids are validated against the
 * real shipped pack so a link never points at fabricated inventory, but the
 * snapshot itself (which items, what proposal) is frozen from what the
 * Companion already has on screen — this route doesn't re-derive it.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireSession();
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const { packId, itemIds, focusedItemId, proposalText, proposalEngine, customerName } = parsed.data;

    const pack = PACKS_BY_ID[packId];
    if (!pack) return NextResponse.json({ error: "unknown-pack" }, { status: 404 });
    const validItemIds = itemIds.filter((id) => pack.inventory.some((i) => i.id === id));
    if (validItemIds.length === 0) {
      return NextResponse.json({ error: "unknown-items" }, { status: 404 });
    }

    const code = await generateUniqueShareCode();
    const sharedExperience = await prisma.sharedExperience.create({
      data: {
        tenantId: ctx.tenantId,
        code,
        packId,
        itemIds: validItemIds as unknown as Prisma.InputJsonValue,
        focusedItemId: focusedItemId && validItemIds.includes(focusedItemId) ? focusedItemId : null,
        proposalText: proposalText ?? null,
        proposalEngine: proposalEngine ?? null,
        customerName: customerName?.trim() || null,
        createdById: ctx.userId,
      },
    });

    return NextResponse.json({ sharedExperience: toSharedExperienceDTO(sharedExperience) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

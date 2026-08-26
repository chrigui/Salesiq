import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { recomputeBuyerIntelligence } from "@/lib/buyerProfiles/recompute";

/** Every activity kind that also appends a BuyerItemRelationship, and the state it appends. */
const ACTIVITY_TO_RELATIONSHIP: Record<string, string> = {
  property_viewed: "viewed",
  item_saved: "saved",
  proposal_generated: "proposal_created",
};

/**
 * The combined write path behind "the buyer did something": one
 * BuyerActivityEvent row, an optional BuyerItemRelationship append (only for
 * kinds in ACTIVITY_TO_RELATIONSHIP, and only when both packId/itemId are
 * present), a lastInteractionAt bump, and an intent/readiness recompute.
 * Extracted from the authenticated /api/buyer-profiles/[id]/activity route
 * so that route and the public Recap events route (PR13) stay consistent —
 * both go through the exact same recompute path regardless of which surface
 * produced the activity, rather than one of them silently drifting to a
 * bare event insert.
 *
 * `kind` is a plain string (BuyerActivityEvent.kind is a String column by
 * design — a large, ever-growing cross-feature vocabulary) so new values
 * like "recap_opened" need no migration; callers that want a closed set
 * enforce it themselves before calling in (see the authenticated route's
 * zod schema).
 */
export async function logBuyerActivity(input: {
  buyerProfileId: string;
  tenantId: string;
  kind: string;
  packId?: string;
  itemId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const { buyerProfileId, tenantId, kind, packId, itemId, meta } = input;

  await prisma.buyerActivityEvent.create({
    data: {
      buyerProfileId,
      tenantId,
      kind,
      packId,
      itemId,
      meta: meta as Prisma.InputJsonValue | undefined,
    },
  });

  const relationshipState = ACTIVITY_TO_RELATIONSHIP[kind];
  if (relationshipState && packId && itemId) {
    await prisma.buyerItemRelationship.create({
      data: { buyerProfileId, tenantId, packId, itemId, state: relationshipState },
    });
  }

  await prisma.buyerProfile.update({ where: { id: buyerProfileId }, data: { lastInteractionAt: new Date() } });
  await recomputeBuyerIntelligence(buyerProfileId);
}

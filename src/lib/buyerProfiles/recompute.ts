import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { classifyIntent } from "@/core/buyerIntelligence/intent";
import { classifyPurchaseReadiness } from "@/core/buyerIntelligence/purchaseReadiness";

/**
 * Recomputes intent + purchase readiness synchronously whenever a
 * contributing row is written (activity, item relationship, objection,
 * rejection) — no background job, matching the "incremental updates"
 * performance guidance. Called from the end of every route that writes one
 * of those rows, so the two derived fields on BuyerProfile never go stale.
 */
export async function recomputeBuyerIntelligence(buyerProfileId: string): Promise<void> {
  const [activityEvents, relationships, objections] = await Promise.all([
    prisma.buyerActivityEvent.findMany({
      where: { buyerProfileId },
      select: { kind: true, itemId: true, createdAt: true },
    }),
    prisma.buyerItemRelationship.findMany({
      where: { buyerProfileId },
      select: { state: true, itemId: true, createdAt: true },
    }),
    prisma.buyerObjection.findMany({
      where: { buyerProfileId },
      select: { kind: true, resolvedAt: true },
    }),
  ]);

  const events = activityEvents.map((e) => ({ kind: e.kind, itemId: e.itemId, createdAt: e.createdAt.getTime() }));
  const rels = relationships.map((r) => ({ state: r.state, itemId: r.itemId, createdAt: r.createdAt.getTime() }));
  const objs = objections.map((o) => ({ kind: o.kind, resolvedAt: o.resolvedAt?.getTime() ?? null }));

  const intent = classifyIntent({ activityEvents: events, relationships: rels, objections: objs });
  const readiness = classifyPurchaseReadiness({ activityEvents: events, relationships: rels, objections: objs });

  await prisma.buyerProfile.update({
    where: { id: buyerProfileId },
    data: {
      intentLevel: intent.level,
      intentReasons: intent.reasons as unknown as Prisma.InputJsonValue,
      intentUpdatedAt: new Date(),
      purchaseReadiness: readiness.stage,
      purchaseReadinessConfidence: readiness.confidence,
      purchaseReadinessSignals: readiness.signals as unknown as Prisma.InputJsonValue,
    },
  });
}

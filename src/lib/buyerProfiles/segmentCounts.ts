import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  compileSegmentWhere,
  matchesJsOnlyCriteria,
  type BuyerSegmentCriterion,
} from "@/core/buyerIntelligence/segments";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";

/**
 * A segment's buyer count is computed live on every read, never cached —
 * the whole point of a declarative segment is that it's always accurate.
 * `priorities` is selected alongside `id` only so `matchesJsOnlyCriteria`
 * can apply the one criterion type Postgres/Prisma can't express as a
 * `where` clause (see compileSegmentWhere) without a second round trip.
 * Shared between the segments list route and the Wave 2 aggregate route
 * so both report the exact same number for the exact same segment.
 */
export async function countSegmentMembers(
  scope: Prisma.BuyerProfileWhereInput,
  criteria: BuyerSegmentCriterion[],
): Promise<number> {
  const rows = await prisma.buyerProfile.findMany({
    where: { AND: [scope, compileSegmentWhere(criteria)] },
    select: { id: true, priorities: true },
  });
  return rows.filter((r) => matchesJsOnlyCriteria({ priorities: r.priorities as BuyerPriority[] | null }, criteria))
    .length;
}

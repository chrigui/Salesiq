import "server-only";
import { prisma } from "@/lib/db";
import type { SessionContext } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { compileNbaRules, type BuyerNbaRuleSpec, type BuyerNbaState } from "@/core/buyerIntelligence/nbaRules";
import { suggestNextBestAction } from "@/core/buyerIntelligence/nextBestAction";
import { matchesAllCriteria, type BuyerSegmentCriterion } from "@/core/buyerIntelligence/segments";
import { findSimilarBuyers, type SimilarityCandidate } from "@/core/buyerIntelligence/similarity";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";
import type { Condition } from "@/core/types";

export interface NextBestActionResult {
  suggestion: string | null;
  source: "rule" | "fallback";
}

function toCandidate(row: {
  id: string;
  name: string;
  purposes: string[];
  priorities: unknown;
  intentLevel: string | null;
  purchaseReadiness: string | null;
}): SimilarityCandidate {
  return {
    id: row.id,
    name: row.name,
    purposes: row.purposes,
    priorities: row.priorities as BuyerPriority[] | null,
    intentLevel: row.intentLevel,
    purchaseReadiness: row.purchaseReadiness,
  };
}

/**
 * Tenant-configurable rules first, the Wave 1 hardcoded
 * suggestNextBestAction() fallback second — a tenant that has never
 * created a BuyerNbaRule sees byte-identical Wave 1 behavior, since
 * compileNbaRules() returns null when there are no rules to evaluate.
 */
export async function resolveNextBestAction(
  ctx: SessionContext,
  buyerProfileId: string,
): Promise<NextBestActionResult> {
  const scope = buildBuyerProfileScope(ctx);
  const profile = await prisma.buyerProfile.findFirst({
    where: { id: buyerProfileId, ...scope },
    select: {
      id: true,
      name: true,
      purposes: true,
      priorities: true,
      intentLevel: true,
      purchaseReadiness: true,
      assignedToId: true,
      branchId: true,
      financial: true,
    },
  });
  if (!profile) return { suggestion: null, source: "fallback" };

  const [activity, relationships, objections, segments, candidateRows, ruleRows] = await Promise.all([
    prisma.buyerActivityEvent.findMany({ where: { buyerProfileId }, select: { kind: true } }),
    prisma.buyerItemRelationship.findMany({ where: { buyerProfileId }, select: { state: true } }),
    prisma.buyerObjection.findMany({ where: { buyerProfileId }, select: { kind: true, confidence: true, resolvedAt: true } }),
    prisma.buyerSegment.findMany({ where: { tenantId: ctx.tenantId }, select: { id: true, criteria: true } }),
    prisma.buyerProfile.findMany({
      where: { ...scope, id: { not: buyerProfileId } },
      select: { id: true, name: true, purposes: true, priorities: true, intentLevel: true, purchaseReadiness: true },
    }),
    prisma.buyerNbaRule.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { priority: "asc" } }),
  ]);

  const unresolvedObjections = objections.filter((o) => !o.resolvedAt);
  const topObjection = unresolvedObjections.find((o) => o.confidence === "high") ?? unresolvedObjections[0];

  const segmentIds = segments
    .filter((s) =>
      matchesAllCriteria(
        {
          intentLevel: profile.intentLevel,
          purchaseReadiness: profile.purchaseReadiness,
          purposes: profile.purposes,
          priorities: profile.priorities as BuyerPriority[] | null,
          assignedToId: profile.assignedToId,
          branchId: profile.branchId,
        },
        s.criteria as unknown as BuyerSegmentCriterion[],
      ),
    )
    .map((s) => s.id);

  const similarCount = findSimilarBuyers(toCandidate(profile), candidateRows.map(toCandidate)).length;

  const state: BuyerNbaState = {
    purchaseReadinessStage: profile.purchaseReadiness ?? "",
    unresolvedObjectionCount: unresolvedObjections.length,
    topObjectionKind: topObjection?.kind ?? "",
    hasProposal: activity.some((a) => a.kind === "proposal_generated"),
    savedCount: relationships.filter((r) => r.state === "saved").length,
    hasFinancialInfo: Boolean(profile.financial && Object.keys(profile.financial as Record<string, unknown>).length > 0),
    segmentIds,
    similarBuyerCount: similarCount,
  };

  const specs: BuyerNbaRuleSpec[] = ruleRows.map((r) => ({
    id: r.id,
    label: r.label,
    priority: r.priority,
    conditions: r.conditions as unknown as Condition[],
    suggestion: r.suggestion,
    enabled: r.enabled,
  }));

  const ruleSuggestion = compileNbaRules(specs, state);
  if (ruleSuggestion) return { suggestion: ruleSuggestion, source: "rule" };

  const fallback = suggestNextBestAction({
    purchaseReadinessStage: profile.purchaseReadiness,
    unresolvedObjections: unresolvedObjections.map((o) => ({ kind: o.kind, confidence: o.confidence })),
    hasProposal: state.hasProposal,
    savedCount: state.savedCount,
    hasFinancialInfo: state.hasFinancialInfo,
  });
  return { suggestion: fallback, source: "fallback" };
}

import type { Answers, IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { whyNotReasons } from "@/core/engine/whyNot";
import { deriveAvailabilityLabel } from "@/lib/availability";
import type { RecapComparedProperties, RecapShortlistedProperty, RecapSnapshot } from "./types";

export interface BuildRecapSnapshotInput {
  pack: IndustryPack;
  answers: Answers;
  /** Full scoreInventory() result for the meeting — the single source of truth for score/reasons. */
  scored: ScoredItem[];
  /** session.recapItemIds — the salesperson-curated set to freeze into the recap. */
  shortlistItemIds: string[];
  /** session.compareItemIds at creation time, if a comparison was active. */
  compareItemIds?: string[];
  customerName?: string;
  /** Explicit override; defaults to the highest-scored shortlisted item. */
  finalRecommendationItemId?: string | null;
}

/**
 * Pure, server-side snapshot builder — the ONLY place that decides what
 * gets frozen into a Recap row. Every reason string here is read straight
 * off ScoredItem.reasons/breakdown (via whyNotReasons for comparisons) —
 * nothing is invented at recap-creation time, matching the "reuse the
 * exact deterministic reasoning that powered the meeting" requirement.
 * price/availability are captured only as *AtCreation snapshots for later
 * diffing (see src/lib/recaps/diff.ts) — never treated as the live truth.
 */
export function buildRecapSnapshot(input: BuildRecapSnapshotInput): RecapSnapshot {
  const { pack, answers, scored, shortlistItemIds, compareItemIds, customerName, finalRecommendationItemId } = input;

  const byItemId = new Map(scored.map((s) => [s.item.id, s]));

  const shortlistedProperties: RecapShortlistedProperty[] = shortlistItemIds
    .map((itemId) => byItemId.get(itemId))
    .filter((s): s is ScoredItem => Boolean(s))
    .map((s, order) => ({
      itemId: s.item.id,
      order,
      score: s.score,
      reasons: s.reasons,
      priceAtCreation: s.item.price,
      currency: s.item.currency,
      availabilityAtCreation: deriveAvailabilityLabel(s.item),
    }));

  const comparedProperties = buildComparedProperties(pack, answers, compareItemIds, byItemId);

  const resolvedFinalRecommendationItemId =
    finalRecommendationItemId !== undefined
      ? finalRecommendationItemId
      : (shortlistedProperties.length > 0
          ? [...shortlistedProperties].sort((a, b) => b.score - a.score)[0].itemId
          : null);

  return {
    customerNameSnapshot: customerName?.trim() ? customerName.trim().split(/\s+/)[0] : null,
    requirementsSnapshot: { ...answers },
    shortlistedProperties,
    comparedProperties,
    finalRecommendationItemId: resolvedFinalRecommendationItemId,
  };
}

function buildComparedProperties(
  pack: IndustryPack,
  answers: Answers,
  compareItemIds: string[] | undefined,
  byItemId: Map<string, ScoredItem>,
): RecapComparedProperties | null {
  if (!compareItemIds || compareItemIds.length < 2) return null;

  const compared = compareItemIds
    .map((itemId) => byItemId.get(itemId))
    .filter((s): s is ScoredItem => Boolean(s));
  if (compared.length < 2) return null;

  const localWinner = [...compared].sort((a, b) => b.score - a.score)[0];
  const differences: string[] = [];
  for (const candidate of compared) {
    if (candidate.item.id === localWinner.item.id) continue;
    const reasons = whyNotReasons(pack, answers, candidate, localWinner);
    for (const reason of reasons) differences.push(`${candidate.item.name}: ${reason}`);
  }

  return { itemIds: compared.map((s) => s.item.id), differences };
}

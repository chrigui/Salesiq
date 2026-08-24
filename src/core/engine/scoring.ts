import type {
  Answers,
  BudgetValue,
  Condition,
  IndustryPack,
  InventoryItem,
  NearbyAmenity,
  Question,
  Recommendation,
} from "@/core/types";
import { haversineMeters } from "@/lib/geoMath";

/** Type guard for the budget range answer shape. */
export function isBudget(v: unknown): v is BudgetValue {
  return (
    typeof v === "object" &&
    v !== null &&
    "min" in v &&
    "max" in v
  );
}

/** Evaluate a question's conditional visibility against current answers. */
export function isVisible(q: Question, answers: Answers): boolean {
  if (!q.showWhen) return true;
  return evalCondition(q.showWhen, answers);
}

export function evalCondition(c: Condition, answers: Answers): boolean {
  const a = answers[c.questionId];
  if (a === undefined) return false;
  switch (c.op) {
    case "truthy":
      return Boolean(a);
    case "eq":
      return a === c.value;
    case "gt":
      return typeof a === "number" && a > (c.value as number);
    case "gte":
      return typeof a === "number" && a >= (c.value as number);
    case "lt":
      return typeof a === "number" && a < (c.value as number);
    case "lte":
      return typeof a === "number" && a <= (c.value as number);
    case "includes":
      return Array.isArray(a) && a.includes(c.value as string);
    default:
      return false;
  }
}

export interface ScoredItem {
  item: InventoryItem;
  score: number; // 0..100
  reasons: string[];
  /** Per-answer contribution, for transparency / debugging. */
  breakdown: { ruleId: string; contribution: number; reason?: string }[];
}

export interface ScoreInventoryOptions {
  /**
   * Buyer Intelligence input, not a second scoring system: a multiplier per
   * questionId (1 = unaffected) derived from a linked BuyerProfile's stated
   * priorities (see src/core/buyerIntelligence/priorityWeights.ts). Applied
   * to that rule's weight before normalisation, so a buyer's "must have"
   * genuinely shifts the ranking rather than just being noted somewhere.
   * Optional and additive — omitting it (every existing caller) leaves
   * scoring byte-for-byte unchanged.
   */
  priorityWeights?: Record<string, number>;
  /**
   * Buyer Intelligence input: item ids a linked buyer has actively rejected
   * (BuyerRejectedItem, minus any the salesperson has since overridden).
   * Excluded from scoring entirely — an actively-rejected item never
   * resurfaces as a recommendation for that buyer. Optional and additive,
   * same as priorityWeights.
   */
  excludeItemIds?: string[];
  /**
   * Real commute fit — a geocoded workplace/destination, how far the buyer
   * will actually go (maxKm, derived from a "maximum commute" answer), and
   * how much that should matter (weight, derived from a "how important is
   * the commute" answer). Computed from each item's real `location`
   * lat/lng via the same haversine distance used everywhere else in this
   * app — never a guessed or invented distance. Optional and additive,
   * same contract as priorityWeights/excludeItemIds: omitting it leaves
   * every existing caller's scoring unchanged.
   */
  commute?: { lat: number; lng: number; maxKm: number; weight: number };
  /**
   * Real "what should be close by" fit — scored only for amenity kinds that
   * have a genuine counterpart in an item's real, OpenStreetMap-fetched
   * `nearbyAmenities` (never a fabricated one). An item with none of the
   * requested kinds nearby scores 0 on this factor rather than being
   * excluded, so a pack whose inventory hasn't had amenities fetched yet
   * just contributes nothing here, not a wrong penalty. Optional and
   * additive, same contract as the options above.
   */
  locationPreferences?: { kinds: NearbyAmenity["kind"][]; weight: number };
}

/**
 * Score every inventory item against the current answers.
 *
 * Each rule returns a 0..1 match plus an optional reason. Contributions are
 * weighted and normalised against the maximum achievable weight for the
 * answers actually provided, so partially-completed sessions still rank
 * sensibly. Reasons are collected so the recommendation can explain itself.
 */
export function scoreInventory(
  pack: IndustryPack,
  answers: Answers,
  opts?: ScoreInventoryOptions,
): ScoredItem[] {
  const priorityWeights = opts?.priorityWeights;
  const effectiveWeight = (questionId: string, weight: number) =>
    weight * (priorityWeights?.[questionId] ?? 1);
  const excludeItemIds = opts?.excludeItemIds;
  const inventory = excludeItemIds?.length
    ? pack.inventory.filter((item) => !excludeItemIds.includes(item.id))
    : pack.inventory;

  const activeRules = pack.rules.filter(
    (r) => answers[r.questionId] !== undefined,
  );
  const { commute, locationPreferences } = opts ?? {};
  const maxWeight =
    activeRules.reduce((sum, r) => sum + effectiveWeight(r.questionId, r.weight), 0) +
      (commute?.weight ?? 0) +
      (locationPreferences?.weight ?? 0) || 1;

  const scored = inventory.map((item) => {
    let raw = 0;
    const reasons: string[] = [];
    const breakdown: ScoredItem["breakdown"] = [];

    for (const rule of activeRules) {
      const result = rule.evaluate(answers[rule.questionId], item);
      if (!result) continue;
      const contribution = result.match * effectiveWeight(rule.questionId, rule.weight);
      raw += contribution;
      breakdown.push({
        ruleId: rule.id,
        contribution,
        reason: result.reason,
      });
      // Only surface strongly-matching reasons on the card.
      if (result.reason && result.match >= 0.6) reasons.push(result.reason);
    }

    if (commute && item.location) {
      const distanceKm =
        haversineMeters(commute.lat, commute.lng, item.location.lat, item.location.lng) / 1000;
      const match = Math.max(0, Math.min(1, 1 - distanceKm / commute.maxKm));
      const contribution = match * commute.weight;
      raw += contribution;
      const reason = `it's about ${Math.round(distanceKm)} km from the commute you need`;
      breakdown.push({ ruleId: "commute", contribution, reason });
      if (match >= 0.6) reasons.push(reason);
    }

    if (locationPreferences && locationPreferences.kinds.length > 0) {
      const matchedKinds = locationPreferences.kinds.filter((kind) =>
        item.nearbyAmenities?.some((a) => a.kind === kind),
      );
      const match = matchedKinds.length / locationPreferences.kinds.length;
      const contribution = match * locationPreferences.weight;
      raw += contribution;
      if (matchedKinds.length > 0) {
        const reason = `it's near the ${matchedKinds.join(", ")} you asked for`;
        breakdown.push({ ruleId: "locationPreferences", contribution, reason });
        if (match >= 0.6) reasons.push(reason);
      } else {
        breakdown.push({ ruleId: "locationPreferences", contribution: 0 });
      }
    }

    return {
      item,
      score: Math.round((raw / maxWeight) * 100),
      reasons,
      breakdown,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/** Convenience: the top-scoring recommendation with a woven narrative. */
export function topRecommendation(
  pack: IndustryPack,
  answers: Answers,
  narrate: (item: ScoredItem, pack: IndustryPack) => string,
): Recommendation | null {
  const scored = scoreInventory(pack, answers);
  if (scored.length === 0) return null;
  const best = scored[0];
  return {
    item: best.item,
    score: best.score,
    reasons: best.reasons,
    narrative: narrate(best, pack),
  };
}

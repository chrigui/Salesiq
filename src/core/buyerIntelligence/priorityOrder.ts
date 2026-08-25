import { IMPORTANCE_MULTIPLIER, type BuyerPriority } from "./priorityWeights";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

/**
 * `toPriorityWeights` turns priorities into scoring multipliers but never
 * ranks them — array order is just entry order. This is the one place that
 * decides display order, sorting by the same IMPORTANCE_MULTIPLIER the
 * engine already uses so "what matters most" reads identically wherever a
 * ranked list is shown (Companion and Display both call this, never a
 * second ordering).
 */
export function rankPriorities(priorities: BuyerPriority[] | null | undefined): BuyerPriority[] {
  if (!priorities?.length) return [];
  return [...priorities].sort(
    (a, b) => (IMPORTANCE_MULTIPLIER[b.importance] ?? 1) - (IMPORTANCE_MULTIPLIER[a.importance] ?? 1),
  );
}

export type PriorityPerformanceStatus = "met" | "partial" | "unmet";

export interface PriorityPerformance {
  priority: BuyerPriority;
  status: PriorityPerformanceStatus;
}

/**
 * Per-property ✓/○/✕ performance against the buyer's ranked priorities —
 * the same breakdown/ruleSpecs cross-reference DecisionBreakdown uses
 * (contribution / weight bucketed at 0.8 / 0.5), the single shared source
 * of truth for both the salesperson-only breakdown and this buyer-facing
 * grid. A priority with no resolvable questionId, or a pack with no
 * matching RuleSpec, is omitted rather than guessed at — showing "unmet"
 * for something never actually scored would be dishonest.
 */
export function computePriorityPerformance(
  priorities: BuyerPriority[] | null | undefined,
  item: ScoredItem,
  pack: IndustryPack,
): PriorityPerformance[] {
  const specs = pack.ruleSpecs ?? [];
  const results: PriorityPerformance[] = [];
  for (const priority of rankPriorities(priorities)) {
    if (!priority.questionId) continue;
    const spec = specs.find((s) => s.questionId === priority.questionId);
    if (!spec || spec.weight <= 0) continue;
    const entry = item.breakdown.find((b) => b.ruleId === spec.id);
    if (!entry) continue;
    const ratio = entry.contribution / spec.weight;
    const status: PriorityPerformanceStatus = ratio >= 0.8 ? "met" : ratio >= 0.5 ? "partial" : "unmet";
    results.push({ priority, status });
  }
  return results;
}

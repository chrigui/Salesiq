export type PriorityImportance = "must" | "important" | "preferred" | "nice" | "not_important";

export interface BuyerPriority {
  /** Human-readable label, always present (e.g. "3 bedrooms", "sea view"). */
  requirement: string;
  /** The real pack.questions id this priority maps to, when resolvable — null for a free-text priority with no corresponding question (e.g. a pack with no "view" question). Only priorities with a questionId can bias scoring; others still display, they just don't feed the engine. */
  questionId?: string | null;
  importance: PriorityImportance;
}

export const IMPORTANCE_MULTIPLIER: Record<PriorityImportance, number> = {
  must: 2,
  important: 1.5,
  preferred: 1,
  nice: 0.7,
  not_important: 0.3,
};

/**
 * Turns a buyer's stated priorities into scoreInventory's optional weight
 * multiplier map — the only channel Buyer Intelligence uses to influence
 * the recommendation engine. Priorities with no resolved questionId are
 * skipped (nothing to multiply), never silently dropped elsewhere — they
 * still render on the profile.
 */
export function toPriorityWeights(priorities: BuyerPriority[] | null | undefined): Record<string, number> {
  if (!priorities) return {};
  const weights: Record<string, number> = {};
  for (const p of priorities) {
    if (!p.questionId) continue;
    weights[p.questionId] = IMPORTANCE_MULTIPLIER[p.importance] ?? 1;
  }
  return weights;
}

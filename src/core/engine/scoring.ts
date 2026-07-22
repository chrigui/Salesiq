import type {
  Answers,
  BudgetValue,
  Condition,
  IndustryPack,
  InventoryItem,
  Question,
  Recommendation,
} from "@/core/types";

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
): ScoredItem[] {
  const activeRules = pack.rules.filter(
    (r) => answers[r.questionId] !== undefined,
  );
  const maxWeight =
    activeRules.reduce((sum, r) => sum + r.weight, 0) || 1;

  const scored = pack.inventory.map((item) => {
    let raw = 0;
    const reasons: string[] = [];
    const breakdown: ScoredItem["breakdown"] = [];

    for (const rule of activeRules) {
      const result = rule.evaluate(answers[rule.questionId], item);
      if (!result) continue;
      const contribution = result.match * rule.weight;
      raw += contribution;
      breakdown.push({
        ruleId: rule.id,
        contribution,
        reason: result.reason,
      });
      // Only surface strongly-matching reasons on the card.
      if (result.reason && result.match >= 0.6) reasons.push(result.reason);
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

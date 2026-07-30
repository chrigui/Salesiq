import type { Answers, IndustryPack, InventoryItem, RuleSpec } from "@/core/types";
import type { ScoredItem } from "./scoring";
import { isBudget } from "./scoring";
import { formatMoney } from "./explain";

/**
 * Why Not Engine (roadmap P0, merged with "Explainable AI"). The scoring
 * engine already computes a full per-rule contribution breakdown for every
 * item, winner and loser alike (see ScoredItem.breakdown) — this reads that
 * same data to explain why an alternative ranked behind the top pick,
 * instead of leaving "reasons" as a winner-only concept.
 *
 * Every line here is derived from the same rule specs and real attribute
 * values the engine itself used to score the item — nothing is invented.
 * Falls back to one honest, generic line only when the pack has no
 * `ruleSpecs` to compare against (a custom tenant pack built without them).
 */
export function whyNotReasons(
  pack: IndustryPack,
  answers: Answers,
  candidate: ScoredItem,
  winner: ScoredItem,
): string[] {
  if (candidate.item.id === winner.item.id) return [];
  const specs = pack.ruleSpecs ?? [];
  const reasons: string[] = [];

  // Rank this item's rule-by-rule shortfall against the winner's, biggest
  // gap first, so the most decisive reason surfaces first.
  const gaps = candidate.breakdown
    .map((entry) => {
      const winnerEntry = winner.breakdown.find((b) => b.ruleId === entry.ruleId);
      return { entry, gap: (winnerEntry?.contribution ?? 0) - entry.contribution };
    })
    .filter((g) => g.gap > 0.3)
    .sort((a, b) => b.gap - a.gap);

  for (const { entry } of gaps) {
    if (reasons.length >= 3) break;
    const spec = specs.find((s) => s.id === entry.ruleId);
    if (!spec) continue;
    const line = explainSpec(spec, pack, answers, candidate.item);
    if (line) reasons.push(line);
  }

  if (reasons.length === 0) {
    reasons.push("Matched fewer of your priorities overall than the top pick.");
  }
  return reasons;
}

function explainSpec(
  spec: RuleSpec,
  pack: IndustryPack,
  answers: Answers,
  item: InventoryItem,
): string | null {
  const question = pack.questions.find((q) => q.id === spec.questionId);
  const label = question?.label ?? "a requirement";
  const answer = answers[spec.questionId];

  switch (spec.kind) {
    case "budget": {
      if (!isBudget(answer)) return null;
      if (item.price > answer.max) {
        return `${formatMoney(item.price - answer.max, item.currency)} over your budget`;
      }
      return null;
    }
    case "atLeast": {
      const attr = spec.attribute ?? spec.questionId;
      const have = Number(item.attributes[attr] ?? 0);
      const need = Number(answer);
      if (Number.isNaN(need) || have >= need) return null;
      return `${label}: has ${have}, you asked for ${need}`;
    }
    case "feature": {
      const attr = spec.attribute ?? spec.questionId;
      if (Boolean(item.attributes[attr])) return null;
      return `Doesn't have ${label.toLowerCase()}`;
    }
    case "proximity": {
      const attr = spec.attribute ?? spec.questionId;
      const v = Number(item.attributes[attr]);
      if (Number.isNaN(v) || !spec.ceiling || v <= spec.ceiling) return null;
      return `${label}: ${v} away, outside the comfortable range`;
    }
    case "investment": {
      const appr = item.appreciation ?? 0;
      if (appr >= 15) return null;
      return `Limited appreciation potential (${appr}%)`;
    }
    default:
      return null;
  }
}

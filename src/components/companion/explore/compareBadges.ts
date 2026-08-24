/**
 * Real, rule-based comparison badges — never fabricated. Each function
 * documents exactly which real field it reads and returns `null` when the
 * group doesn't actually have the backing data, rather than guessing.
 */
import type { Answers, IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

export interface CompareBadges {
  /** Highest real scoreInventory score in the group. Always present for a non-empty group. */
  bestMatchId: string | null;
  /** Lowest price among items scoring at/above the group's median score. */
  bestValueId: string | null;
  /** Highest real `item.appreciation` — omitted if no item in the group has it set. */
  bestInvestmentId: string | null;
  /** Most real `item.lifestyle.tags` matching the customer's selected lifestyle answers — omitted if nothing matches. */
  bestLifestyleId: string | null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function bestMatch(group: ScoredItem[]): string | null {
  if (group.length === 0) return null;
  return group.reduce((best, s) => (s.score > best.score ? s : best), group[0]).item.id;
}

function bestValue(group: ScoredItem[]): string | null {
  if (group.length === 0) return null;
  const med = median(group.map((s) => s.score));
  const qualifying = group.filter((s) => s.score >= med);
  if (qualifying.length === 0) return null;
  return qualifying.reduce((best, s) => (s.item.price < best.item.price ? s : best), qualifying[0]).item.id;
}

function bestInvestment(group: ScoredItem[]): string | null {
  const withAppreciation = group.filter((s) => s.item.appreciation !== undefined);
  if (withAppreciation.length === 0) return null;
  return withAppreciation.reduce((best, s) => (s.item.appreciation! > best.item.appreciation! ? s : best))
    .item.id;
}

/** The pack's own lifestyleStyle question options the customer actually
 * selected — real session answers, never invented preferences. */
function selectedLifestyleLabels(pack: IndustryPack, answers: Answers): string[] {
  const question = pack.questions.find((q) => q.id === "lifestyleStyle");
  const selected = answers.lifestyleStyle;
  if (!question?.options || !Array.isArray(selected)) return [];
  return question.options.filter((o) => selected.includes(o.id)).map((o) => o.label.toLowerCase());
}

function bestLifestyle(pack: IndustryPack, answers: Answers, group: ScoredItem[]): string | null {
  const wanted = selectedLifestyleLabels(pack, answers);
  if (wanted.length === 0) return null;
  let bestId: string | null = null;
  let bestCount = 0;
  for (const s of group) {
    const tags = s.item.lifestyle?.tags?.map((t) => t.toLowerCase()) ?? [];
    const count = tags.filter((t) => wanted.some((w) => t.includes(w) || w.includes(t))).length;
    if (count > bestCount) {
      bestCount = count;
      bestId = s.item.id;
    }
  }
  return bestCount > 0 ? bestId : null;
}

export function computeCompareBadges(pack: IndustryPack, answers: Answers, group: ScoredItem[]): CompareBadges {
  return {
    bestMatchId: bestMatch(group),
    bestValueId: bestValue(group),
    bestInvestmentId: bestInvestment(group),
    bestLifestyleId: bestLifestyle(pack, answers, group),
  };
}

import type { ScoringRule } from "@/core/types";
import { isBudget } from "@/core/engine/scoring";

/**
 * Reusable scoring-rule builders shared across industry packs.
 * Companies configure these through the (future) visual rule builder; here
 * they are expressed in code to seed the demo packs.
 */

/** Budget fit: full match inside range, graceful fall-off just outside. */
export function budgetRule(questionId: string, weight = 3): ScoringRule {
  return {
    id: `${questionId}-budget`,
    questionId,
    weight,
    evaluate: (answer, item) => {
      if (!isBudget(answer)) return null;
      const { min, max } = answer;
      if (item.price >= min && item.price <= max) {
        return { match: 1, reason: `it is within budget at ${money(item)}` };
      }
      // 15% over budget still scores partially.
      if (item.price > max) {
        const over = (item.price - max) / max;
        if (over <= 0.15)
          return {
            match: 1 - over / 0.15,
            reason: `it is only slightly above budget at ${money(item)}`,
          };
        return { match: 0 };
      }
      // Under min — under-spending is fine but less "on-target".
      return { match: 0.7, reason: `it comes in under budget at ${money(item)}` };
    },
  };
}

/** Match a numeric "close enough is better" attribute, e.g. distance/proximity. */
export function proximityRule(
  questionId: string,
  attribute: string,
  opts: { weight?: number; reason: (v: number) => string } & {
    /** Lower is better up to this ceiling. */
    ceiling: number;
  },
): ScoringRule {
  return {
    id: `${questionId}-${attribute}`,
    questionId,
    attribute,
    weight: opts.weight ?? 2,
    evaluate: (answer, item) => {
      if (answer !== true && answer !== "yes") return null;
      const v = Number(item.attributes[attribute]);
      if (Number.isNaN(v)) return { match: 0 };
      const match = Math.max(0, Math.min(1, 1 - v / opts.ceiling));
      if (match <= 0) return { match: 0 };
      return { match, reason: opts.reason(v) };
    },
  };
}

/** Reward items whose boolean attribute matches a "want this feature" answer. */
export function featureRule(
  questionId: string,
  attribute: string,
  reason: string,
  weight = 2,
): ScoringRule {
  return {
    id: `${questionId}-${attribute}`,
    questionId,
    attribute,
    weight,
    evaluate: (answer, item) => {
      const wants = answer === true || answer === "yes" || answer === attribute;
      if (!wants) return null;
      const has = Boolean(item.attributes[attribute]);
      return has ? { match: 1, reason } : { match: 0 };
    },
  };
}

/** Reward items meeting/exceeding a numeric threshold (e.g. bedrooms, seats). */
export function atLeastRule(
  questionId: string,
  attribute: string,
  reason: (need: number, have: number) => string,
  weight = 2.5,
): ScoringRule {
  return {
    id: `${questionId}-${attribute}-min`,
    questionId,
    attribute,
    weight,
    evaluate: (answer, item) => {
      const need = Number(answer);
      if (Number.isNaN(need)) return null;
      const have = Number(item.attributes[attribute] ?? 0);
      if (have >= need)
        return { match: 1, reason: reason(need, have) };
      // Missing by one still partly matches.
      const deficit = need - have;
      return { match: Math.max(0, 1 - deficit / need) };
    },
  };
}

/** Reward high appreciation when the customer signals investment intent. */
export function investmentRule(questionId: string, weight = 2.5): ScoringRule {
  return {
    id: `${questionId}-appreciation`,
    questionId,
    weight,
    evaluate: (answer, item) => {
      const wantsInvestment =
        answer === true ||
        (Array.isArray(answer) && answer.includes("investment"));
      if (!wantsInvestment) return null;
      const appr = item.appreciation ?? 0;
      const match = Math.max(0, Math.min(1, appr / 20));
      if (match <= 0) return { match: 0 };
      return {
        match,
        reason: `it has strong investment potential with ${appr}% appreciation over three years`,
      };
    },
  };
}

function money(item: { price: number; currency: string }): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: item.currency,
      maximumFractionDigits: 0,
    }).format(item.price);
  } catch {
    return `${item.currency} ${item.price.toLocaleString()}`;
  }
}

import type { Answers, Condition } from "@/core/types";
import { evalCondition } from "@/core/engine/scoring";

/**
 * Wave 2 configurable Next Best Action — reuses the existing Condition
 * type and evalCondition() verbatim (src/core/types.ts,
 * src/core/engine/scoring.ts): a Condition's `questionId` is repurposed
 * here as a BuyerNbaState field name, since evalCondition only ever does
 * `answers[c.questionId]` — it never assumes the record is actually
 * questionnaire answers. BuyerNbaState is structurally an Answers record
 * (every field is a valid AnswerValue), so the same evaluator works
 * unchanged.
 */
export interface BuyerNbaState {
  purchaseReadinessStage: string; // "" when not yet classified
  unresolvedObjectionCount: number;
  topObjectionKind: string; // "" when there are no unresolved objections
  hasProposal: boolean;
  savedCount: number;
  hasFinancialInfo: boolean;
  segmentIds: string[];
  similarBuyerCount: number;
}

export type BuyerNbaField = keyof BuyerNbaState;

export const NBA_FIELD_INFO: Record<BuyerNbaField, { label: string; ops: Condition["op"][] }> = {
  purchaseReadinessStage: { label: "Purchase readiness stage", ops: ["eq"] },
  unresolvedObjectionCount: { label: "Unresolved objections (count)", ops: ["gt", "gte", "lt", "lte", "eq"] },
  topObjectionKind: { label: "Top objection kind", ops: ["eq"] },
  hasProposal: { label: "Has a proposal", ops: ["truthy", "eq"] },
  savedCount: { label: "Saved items (count)", ops: ["gt", "gte", "lt", "lte", "eq"] },
  hasFinancialInfo: { label: "Has financial info", ops: ["truthy", "eq"] },
  segmentIds: { label: "Segment membership", ops: ["includes"] },
  similarBuyerCount: { label: "Similar buyers (count)", ops: ["gt", "gte", "lt", "lte", "eq"] },
};

export interface BuyerNbaRuleSpec {
  id: string;
  label: string;
  priority: number;
  conditions: Condition[];
  suggestion: string;
  enabled: boolean;
}

function fillTemplate(template: string, state: BuyerNbaState): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = (state as unknown as Record<string, unknown>)[key];
    return value === undefined || value === null || value === "" ? match : String(value);
  });
}

/**
 * First enabled rule (lowest `priority` first) whose conditions all match,
 * with its suggestion template filled in from the real state — or null if
 * nothing matches, so the caller can fall back to the Wave 1 hardcoded
 * hint. A rule with no conditions never matches (there's nothing to
 * evaluate), so an empty-conditions rule can't accidentally fire for
 * every buyer.
 */
export function compileNbaRules(specs: BuyerNbaRuleSpec[], state: BuyerNbaState): string | null {
  const answers = state as unknown as Answers;
  const sorted = [...specs].filter((s) => s.enabled).sort((a, b) => a.priority - b.priority);
  for (const spec of sorted) {
    if (spec.conditions.length === 0) continue;
    if (spec.conditions.every((c) => evalCondition(c, answers))) {
      return fillTemplate(spec.suggestion, state);
    }
  }
  return null;
}

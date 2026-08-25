/**
 * Turns real session answers (+ ranked Buyer Intelligence priorities) into
 * the compact {label, value} list shown in both the live Buyer Profile
 * panel and the "Here's what we heard" confirmation screen — one shaping
 * function, two consumers, so the two views never drift apart. Reads only
 * from pack.questions/sections and the answers already given; never
 * fabricates a value.
 */
import type { Answers, AnswerValue, IndustryPack, Question } from "@/core/types";
import { isVisible, isBudget } from "@/core/engine/scoring";
import { formatMoney } from "@/core/engine/explain";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";

export interface SummaryEntry {
  questionId: string;
  label: string;
  value: string;
}

export interface SummarySection {
  id: string;
  label: string;
  entries: SummaryEntry[];
}

const BEDROOM_LABEL: Record<number, string> = { 0: "Studio" };

function optionLabel(q: Question, id: unknown): string | undefined {
  return q.options?.find((o) => o.id === id)?.label;
}

function formatValue(q: Question, answer: AnswerValue, pack: IndustryPack): string | undefined {
  switch (q.type) {
    case "single":
      return optionLabel(q, answer) ?? String(answer);
    case "multi": {
      if (!Array.isArray(answer) || answer.length === 0) return undefined;
      const labels = answer.map((id) => optionLabel(q, id) ?? String(id));
      return labels.join(", ");
    }
    case "budget":
      if (!isBudget(answer)) return undefined;
      return `${formatMoney(answer.min, pack.currency)} – ${formatMoney(answer.max, pack.currency)}`;
    case "counter": {
      if (typeof answer !== "number") return undefined;
      if (q.id === "bedrooms") return BEDROOM_LABEL[answer] ?? (answer >= 5 ? "5+" : String(answer));
      return String(answer);
    }
    case "toggle":
      return answer ? "Yes" : "No";
    case "text":
      return typeof answer === "string" && answer.trim() ? answer.trim() : undefined;
    default:
      return undefined;
  }
}

/** Grouped by the pack's own sections, skipping anything unanswered or hidden. */
export function buildAnswerSummary(pack: IndustryPack, answers: Answers): SummarySection[] {
  return pack.sections
    .map((section) => {
      const entries: SummaryEntry[] = [];
      for (const q of pack.questions) {
        if (q.section !== section.id) continue;
        const answer = answers[q.id];
        if (answer === undefined) continue;
        if (!isVisible(q, answers)) continue;
        const value = formatValue(q, answer, pack);
        if (value === undefined) continue;
        entries.push({ questionId: q.id, label: q.label, value });
      }
      return { id: section.id, label: section.label, entries };
    })
    .filter((section) => section.entries.length > 0);
}

/** A priority's `requirement` is either a real question-option id (lifestyle
 * chips ranked via the wizard) or an already-human label (the existing
 * conversation-note priorityLabel/secondaryLabel mechanism) — resolve the
 * former against the pack, and pass the latter through untouched. */
export function labelForRequirement(requirement: string, pack: IndustryPack): string {
  for (const q of pack.questions) {
    const label = optionLabel(q, requirement);
    if (label) return label;
  }
  return requirement;
}

export function buildPriorityEntries(
  priorities: BuyerPriority[] | null | undefined,
  pack: IndustryPack,
): SummaryEntry[] {
  if (!priorities?.length) return [];
  return priorities.map((p, index) => ({
    questionId: p.questionId ?? `priority-${index}`,
    label: `Priority ${index + 1}`,
    value: labelForRequirement(p.requirement, pack),
  }));
}

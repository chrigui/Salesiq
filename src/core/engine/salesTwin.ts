import type { Answers, IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import type { TimelineEvent } from "@/core/store/session";
import { isVisible } from "@/core/engine/scoring";

export type Pace = "fast" | "steady" | "deliberate";
export type BudgetPosture = "flexible" | "comfortable" | "tight";
export type Confidence = "high" | "medium" | "low";

export interface SalesTwinProfile {
  progressPct: number;
  pace: Pace | null;
  budgetPosture: BudgetPosture | null;
  confidence: Confidence;
  topDrivers: string[];
}

const FLIP_FLOP_WINDOW = 12;

/**
 * AI Sales Twin (roadmap P2). Not a parallel data model or a fabricated ML
 * persona — a live read of the same three things the rest of the platform
 * already tracks for real: how far through the questionnaire they are, the
 * pace of their answers (from real timeline timestamps), whether the top
 * pick sits inside their stated budget, and which rule contributions
 * actually drove the current top score (ScoredItem.breakdown, the same
 * data the Why-Not panel reads). No new store, no continuous LLM calls —
 * matching the deterministic-first pattern the Differentiation Audit
 * recommended for this feature.
 */
export function buildSalesTwin(
  pack: IndustryPack,
  answers: Answers,
  timeline: TimelineEvent[],
  scored: ScoredItem[],
): SalesTwinProfile {
  const visibleQuestions = pack.questions.filter((q) => isVisible(q, answers));
  const answeredCount = visibleQuestions.filter((q) => answers[q.id] !== undefined).length;
  const progressPct = visibleQuestions.length > 0
    ? Math.round((answeredCount / visibleQuestions.length) * 100)
    : 0;

  const answerEvents = timeline.filter((e) => e.kind === "answer");
  let pace: Pace | null = null;
  if (answerEvents.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < answerEvents.length; i++) {
      gaps.push(answerEvents[i].ts - answerEvents[i - 1].ts);
    }
    const avgMs = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    pace = avgMs < 15_000 ? "fast" : avgMs < 45_000 ? "steady" : "deliberate";
  }

  const top = scored[0];
  const budgetQuestion = pack.questions.find((q) => q.type === "budget");
  const budgetAnswer = budgetQuestion ? answers[budgetQuestion.id] : undefined;
  let budgetPosture: BudgetPosture | null = null;
  if (top && budgetAnswer && typeof budgetAnswer === "object" && "max" in budgetAnswer) {
    const max = (budgetAnswer as { max: number }).max;
    if (max > 0) {
      const headroom = (max - top.item.price) / max;
      budgetPosture = headroom < 0 ? "tight" : headroom < 0.1 ? "comfortable" : "flexible";
    }
  }

  const objectionCount = timeline.filter((e) => e.kind === "objection").length;
  const recent = timeline.slice(-FLIP_FLOP_WINDOW);
  const answerCounts = new Map<string, number>();
  for (const e of recent) {
    if (e.kind === "answer" && e.questionId) {
      answerCounts.set(e.questionId, (answerCounts.get(e.questionId) ?? 0) + 1);
    }
  }
  const flipFlopped = [...answerCounts.values()].some((count) => count >= 3);
  const confidence: Confidence =
    objectionCount >= 2 || flipFlopped ? "low" : objectionCount === 1 ? "medium" : "high";

  const topDrivers: string[] = [];
  if (top) {
    const specs = pack.ruleSpecs ?? [];
    const ranked = [...top.breakdown]
      .filter((b) => b.contribution > 0)
      .sort((a, b) => b.contribution - a.contribution);
    for (const entry of ranked) {
      if (topDrivers.length >= 2) break;
      const spec = specs.find((s) => s.id === entry.ruleId);
      const question = spec ? pack.questions.find((q) => q.id === spec.questionId) : undefined;
      const label = question?.label;
      if (label && !topDrivers.includes(label)) topDrivers.push(label);
    }
  }

  return { progressPct, pace, budgetPosture, confidence, topDrivers };
}

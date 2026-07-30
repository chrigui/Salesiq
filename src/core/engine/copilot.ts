import type { Answers, IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import type { TimelineEvent } from "@/core/store/session";
import { formatMoney } from "@/core/engine/explain";

export type CopilotSeverity = "info" | "warn" | "urgent";

export interface CopilotSignal {
  id: string;
  severity: CopilotSeverity;
  title: string;
  talkingPoint: string;
}

const PAUSE_MS = 90_000;
const FLIP_FLOP_WINDOW = 12;

/**
 * Sales Copilot (roadmap P2, merging the brief's AI Objection Predictor,
 * Negotiation Copilot and Sales Coaching Engine into one proactive layer —
 * see the Enterprise Differentiation Audit §02). Every signal below reads
 * only real session state already collected elsewhere (the timeline,
 * answers, and the engine's own scores) and renders a template-based
 * talking point — deterministic, matching the "no fabricated numbers"
 * standard everywhere else in this codebase. Claude-authored phrasing
 * remains available on demand through the existing Objection Handler,
 * which this panel links out to rather than duplicating.
 */
export function detectSignals(
  pack: IndustryPack,
  answers: Answers,
  timeline: TimelineEvent[],
  bookmarks: string[],
  scored: ScoredItem[],
  now = Date.now(),
): CopilotSignal[] {
  const signals: CopilotSignal[] = [];
  const top = scored[0];
  const runnerUp = scored[1];

  const budgetQuestion = pack.questions.find((q) => q.type === "budget");
  const budgetAnswer = budgetQuestion ? answers[budgetQuestion.id] : undefined;
  if (
    top &&
    budgetAnswer &&
    typeof budgetAnswer === "object" &&
    "max" in budgetAnswer
  ) {
    const over = top.item.price - (budgetAnswer as { max: number }).max;
    if (over > 0) {
      signals.push({
        id: "budget-tension",
        severity: "warn",
        title: "Budget tension on the top pick",
        talkingPoint: `${top.item.name} is ${formatMoney(over, top.item.currency)} over their stated max — worth confirming whether that ceiling is firm or if the extras justify the gap.`,
      });
    }
  }

  const objectionCount = timeline.filter((e) => e.kind === "objection").length;
  if (objectionCount >= 2) {
    signals.push({
      id: "repeated-objections",
      severity: "urgent",
      title: "Multiple objections raised",
      talkingPoint: `They've pushed back ${objectionCount} times this session — likely worth naming the hesitation directly rather than pitching another feature.`,
    });
  }

  const recent = timeline.slice(-FLIP_FLOP_WINDOW);
  const answerCounts = new Map<string, number>();
  for (const e of recent) {
    if (e.kind === "answer" && e.questionId) {
      answerCounts.set(e.questionId, (answerCounts.get(e.questionId) ?? 0) + 1);
    }
  }
  const flipFlopped = [...answerCounts.entries()].find(([, count]) => count >= 3);
  if (flipFlopped) {
    const q = pack.questions.find((qq) => qq.id === flipFlopped[0]);
    signals.push({
      id: "flip-flop",
      severity: "warn",
      title: "Still deciding on one answer",
      talkingPoint: `They've changed "${q?.label ?? flipFlopped[0]}" ${flipFlopped[1]} times — that's likely the real decision point, worth asking about directly.`,
    });
  }

  const lastEvent = timeline[timeline.length - 1];
  if (lastEvent && now - lastEvent.ts > PAUSE_MS) {
    const seconds = Math.round((now - lastEvent.ts) / 1000);
    signals.push({
      id: "long-pause",
      severity: "info",
      title: "No activity for a while",
      talkingPoint: `Nothing recorded for ${seconds}s — check in, or ask if they have a question before moving on.`,
    });
  }

  if (bookmarks.length >= 2) {
    signals.push({
      id: "comparison-shopping",
      severity: "info",
      title: "Comparing multiple options",
      talkingPoint: `${bookmarks.length} items bookmarked — pulling up Compare side-by-side may help them settle faster than more one-at-a-time pitching.`,
    });
  }

  if (top && runnerUp && top.score - runnerUp.score <= 5 && top.score > 0) {
    signals.push({
      id: "close-call",
      severity: "info",
      title: "Two options are nearly tied",
      talkingPoint: `${top.item.name} and ${runnerUp.item.name} are only ${top.score - runnerUp.score} points apart — asking one clarifying question could break the tie cleanly.`,
    });
  }

  const severityRank: Record<CopilotSeverity, number> = { urgent: 0, warn: 1, info: 2 };
  return signals.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

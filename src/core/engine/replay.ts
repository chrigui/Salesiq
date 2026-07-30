import type { ScoredItem } from "@/core/engine/scoring";
import type { TimelineEvent } from "@/core/store/session";

/**
 * AI Meeting Replay (roadmap P2). The session timeline already stores every
 * interaction as structured, ordered events (see SessionTimeline.tsx) —
 * this reads that same list into a short recap instead of a new event log,
 * deterministically (no LLM call, matching the architecture note that a
 * live/replay feature should stay on the cheap deterministic layer rather
 * than calling out per session).
 */
export function summarizeSession(events: TimelineEvent[], scored: ScoredItem[]): string[] {
  if (events.length === 0) return [];
  const lines: string[] = [];

  const first = events[0].ts;
  const last = events[events.length - 1].ts;
  const minutes = Math.max(1, Math.round((last - first) / 60_000));
  lines.push(
    `${minutes} minute${minutes === 1 ? "" : "s"} session, ${events.length} interaction${events.length === 1 ? "" : "s"} recorded.`,
  );

  const answered = new Set(events.filter((e) => e.kind === "answer").map((e) => e.questionId)).size;
  if (answered > 0) lines.push(`${answered} question${answered === 1 ? "" : "s"} answered.`);

  const itemsViewed = new Set(
    events.filter((e) => e.kind === "focus" && e.itemId).map((e) => e.itemId),
  ).size;
  if (itemsViewed > 0) lines.push(`${itemsViewed} item${itemsViewed === 1 ? "" : "s"} opened for detail.`);

  const objections = events.filter((e) => e.kind === "objection").length;
  if (objections > 0) lines.push(`${objections} objection${objections === 1 ? "" : "s"} handled.`);

  if (events.some((e) => e.kind === "proposal")) {
    lines.push("Proposal presented on the customer display.");
  }
  if (events.some((e) => e.kind === "lead")) {
    lines.push("Lead saved to CRM.");
  }

  if (scored[0]) {
    lines.push(`Currently leading: ${scored[0].item.name} (score ${scored[0].score}).`);
  }

  return lines;
}

/** Whether clicking this event can meaningfully jump the session back to that moment. */
export function isJumpable(event: TimelineEvent): boolean {
  if (event.kind === "focus" || event.kind === "bookmark-add") return Boolean(event.itemId);
  if (event.kind === "answer") return Boolean(event.questionId);
  if (event.kind === "proposal") return true;
  return false;
}

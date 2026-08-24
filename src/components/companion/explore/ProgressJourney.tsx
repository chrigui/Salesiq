"use client";

import { Check } from "lucide-react";
import { cx } from "@/components/ui/primitives";
import type { MeetingStage } from "../meetingFlow";

type StepState = "done" | "current" | "upcoming";

const STEPS: { id: string; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "match", label: "Match" },
  { id: "compare", label: "Compare" },
  { id: "decide", label: "Decide" },
  { id: "recap", label: "Recap" },
];

/**
 * A read-only meeting-journey indicator for the salesperson — never a new
 * piece of state, just a pure function of state that already exists:
 * meetingFlow's own stage (Companion-local, so this can only ever render
 * Companion-side, not on the Display), how many items are in the current
 * comparison group, and whether a proposal has actually been generated.
 * "Recap" has no real backing signal of its own (there's no post-proposal
 * "meeting closed" field), so it can only ever show as current or upcoming,
 * never fabricated as done.
 */
export function ProgressJourney({
  stage,
  compareCount,
  hasProposal,
}: {
  stage: MeetingStage;
  compareCount: number;
  hasProposal: boolean;
}) {
  const reachedExplore = stage === "explore" || stage === "workspace";
  const engagedBeyondList = compareCount > 0 || hasProposal;

  const states: Record<string, StepState> = {
    discover: reachedExplore ? "done" : "upcoming",
    match: !reachedExplore ? "upcoming" : engagedBeyondList ? "done" : "current",
    compare: compareCount >= 2 ? "done" : compareCount === 1 ? "current" : "upcoming",
    decide: hasProposal ? "done" : compareCount >= 2 ? "current" : "upcoming",
    recap: hasProposal ? "current" : "upcoming",
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
      {STEPS.map((step, i) => {
        const state = states[step.id];
        return (
          <div key={step.id} className="flex shrink-0 items-center gap-1.5">
            <div
              className={cx(
                "flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
                state === "done" && "bg-brand/15 text-brand",
                state === "current" && "bg-brand text-white",
                state === "upcoming" && "bg-white/5 text-ink-faint",
              )}
            >
              {state === "done" && <Check className="h-3 w-3" />}
              {step.label}
            </div>
            {i < STEPS.length - 1 && <div className="h-px w-3 bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

import { Check } from "lucide-react";
import { cx } from "@/components/ui/primitives";
import type { DisplayWidgetContext } from "../types";

/**
 * Maps directly onto the real session flow (DisplayStage's `view` state
 * machine) rather than an invented checklist. This widget only ever renders
 * during "item" view (Display Studio profiles are only resolved then), so
 * "Details" is always the current step when it's visible; "Proposal" is
 * marked complete only when a real proposal exists (hasProposal), never
 * assumed.
 */
const STEPS = ["Requirements", "Matches", "Details", "Proposal"] as const;

export function DisplayProgressSteps({ sessionView, hasProposal, mode }: DisplayWidgetContext) {
  if (!sessionView) {
    if (mode === "preview") {
      return (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center">
          <p className="text-xs text-white/40">Shows live session progress once a customer session is active.</p>
        </div>
      );
    }
    return null;
  }

  // This widget only renders in "item" view, so "Details" (index 2) is
  // always the current step; Proposal is the only step whose completion
  // isn't implied by reaching this point.
  const currentIndex = 2;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const isProposal = i === 3;
          const done = isProposal ? Boolean(hasProposal) : i < currentIndex;
          const current = i === currentIndex;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cx(
                    "grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold",
                    done
                      ? "bg-brand text-black"
                      : current
                        ? "bg-brand/20 text-brand ring-2 ring-brand"
                        : "bg-white/10 text-white/40",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={cx("text-[10px]", current ? "font-semibold text-white" : "text-white/40")}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cx("mx-2 h-px flex-1", i < currentIndex ? "bg-brand" : "bg-white/10")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

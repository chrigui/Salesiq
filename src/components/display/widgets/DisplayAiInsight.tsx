import { Sparkles } from "lucide-react";
import type { DisplayWidgetContext } from "../types";

/** The same real narrate() output DisplayMatchScore's top reason comes from, shown in full — not a separate/new generator, so the two widgets never disagree. */
export function DisplayAiInsight({ matchScore, mode }: DisplayWidgetContext) {
  if (!matchScore) {
    if (mode === "preview") {
      return (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center">
          <p className="text-xs text-white/40">Shows a live AI insight once a customer session is active.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">
        <Sparkles className="h-3.5 w-3.5 text-brand" /> AI insight
      </div>
      <p className="text-xs leading-relaxed text-white/70">{matchScore.narrative}</p>
    </div>
  );
}

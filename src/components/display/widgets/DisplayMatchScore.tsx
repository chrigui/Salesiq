import { Sparkles } from "lucide-react";
import type { DisplayWidgetContext } from "../types";

/**
 * "Why we recommend this" — the real scoreInventory()/narrate() output
 * (threaded in by DisplayStage as `matchScore`), never a fabricated number.
 * Renders nothing live when there's no active customer session to score
 * against (idle mode); an honest placeholder in the editor preview.
 */
export function DisplayMatchScore({ matchScore, mode }: DisplayWidgetContext) {
  if (!matchScore) {
    if (mode === "preview") {
      return (
        <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-white/15 p-4 text-center">
          <p className="text-xs text-white/40">Shows the live match score once a customer session is active.</p>
        </div>
      );
    }
    return null;
  }

  const { score, reasons } = matchScore;
  const pct = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">
        <Sparkles className="h-3.5 w-3.5" /> Why we recommend this
      </div>
      <div className="flex items-center gap-4">
        <div
          className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(rgb(var(--brand)) ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
            {pct}%
          </div>
        </div>
        <p className="text-xs leading-relaxed text-white/70">{reasons[0] ?? "A strong match on your priorities."}</p>
      </div>
    </div>
  );
}

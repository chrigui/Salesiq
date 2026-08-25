import { Sparkles } from "lucide-react";
import type { DisplayWidgetContext } from "../types";

export type MatchScoreDisplayStyle = "Ring" | "Bar" | "Number" | "Minimal";

function readConfig(config: Record<string, unknown> | undefined) {
  const style = config?.displayStyle;
  const displayStyle: MatchScoreDisplayStyle =
    style === "Bar" || style === "Number" || style === "Minimal" ? style : "Ring";
  const showReasons = config?.showReasons !== false;
  return { displayStyle, showReasons };
}

/**
 * "Why we recommend this" — the real scoreInventory()/narrate() output
 * (threaded in by DisplayStage as `matchScore`), never a fabricated number.
 * Renders nothing live when there's no active customer session to score
 * against (idle mode); an honest placeholder in the editor preview.
 */
export function DisplayMatchScore({ matchScore, mode, config }: DisplayWidgetContext) {
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

  const { displayStyle, showReasons } = readConfig(config);
  const { score, reasons } = matchScore;
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const reasonText = reasons[0] ?? "A strong match on your priorities.";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">
        <Sparkles className="h-3.5 w-3.5" /> Why we recommend this
      </div>
      <div className="flex items-center gap-4">
        {displayStyle === "Ring" && (
          <div
            className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(rgb(var(--brand)) ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
              {pct}%
            </div>
          </div>
        )}
        {displayStyle === "Bar" && (
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-white/50">Match</span>
              <span className="font-semibold text-white">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        {displayStyle === "Number" && (
          <div className="shrink-0 text-3xl font-bold text-brand">{pct}%</div>
        )}
        {displayStyle === "Minimal" && (
          <div className="shrink-0 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
            {pct}% match
          </div>
        )}
        {showReasons && <p className="text-xs leading-relaxed text-white/70">{reasonText}</p>}
      </div>
    </div>
  );
}

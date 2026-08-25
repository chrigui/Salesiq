"use client";

import { useState } from "react";
import { ArrowLeft, ListChecks, Sliders, Trophy } from "lucide-react";
import { useSession } from "@/core/store/session";
import { useScoreOptions } from "./discoveryScoring";
import { ComparisonExperience } from "./explore/ComparisonExperience";
import { DisplayControl } from "./DisplayControl";
import { DecisionSimulator } from "./DecisionSimulator";
import type { ScoredItem } from "@/core/engine/scoring";
import type { IndustryPack } from "@/core/types";

/** Decision Room supports 2-4 properties in a comparison (spec section 3)
 * — a UI-level cap enforced only here, not a change to compareItemIds'
 * underlying cardinality (the plain Explorer's Compare tab stays unbounded). */
const MAX_COMPARE = 4;

/**
 * The Decision Room's "compare" step — mounts the real, shared
 * ComparisonExperience unchanged (so the plain Explorer's Compare tab and
 * this screen never drift), and adds only the Decision-Room-specific chrome
 * around it. "What if" opens the same DecisionSimulator CompanionApp uses,
 * scoped to this compare group via groupItemIds so a budget slide shows how
 * *this* shortlist re-ranks rather than the whole pack — it never touches
 * session.answers, so closing it leaves the real comparison untouched.
 */
export function DecisionRoomComparison({
  pack,
  scored,
  onBack,
  onShowPriorities,
  onShowRecommend,
}: {
  pack: IndustryPack;
  scored: ScoredItem[];
  onBack: () => void;
  onShowPriorities: () => void;
  onShowRecommend: () => void;
}) {
  const session = useSession();
  const opts = useScoreOptions(pack);
  const atCap = session.compareItemIds.length >= MAX_COMPARE;
  const [displayControlFor, setDisplayControlFor] = useState<ScoredItem | null>(null);
  const [whatIfOpen, setWhatIfOpen] = useState(false);

  return (
    <div className="bg-aurora min-h-screen px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to shortlist
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWhatIfOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
            >
              <Sliders className="h-3.5 w-3.5 text-brand" />
              What if
            </button>
            <button
              onClick={onShowPriorities}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
            >
              <ListChecks className="h-3.5 w-3.5 text-brand" />
              Priorities
            </button>
          </div>
        </div>

        <ComparisonExperience pack={pack} scored={scored} onDisplayControl={setDisplayControlFor} enableRecap />

        {atCap && (
          <p className="mt-4 text-center text-xs text-ink-faint">
            Comparing {MAX_COMPARE} at a time in the Decision Room — remove one to add another.
          </p>
        )}

        <button
          onClick={onShowRecommend}
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Trophy className="h-4 w-4" />
          Recommend
        </button>
      </div>

      {displayControlFor && (
        <DisplayControl item={displayControlFor} onClose={() => setDisplayControlFor(null)} />
      )}

      <DecisionSimulator
        open={whatIfOpen}
        onClose={() => setWhatIfOpen(false)}
        pack={pack}
        answers={session.answers}
        opts={opts}
        groupItemIds={session.compareItemIds}
      />
    </div>
  );
}

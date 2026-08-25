"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useSession } from "@/core/store/session";
import { ComparisonExperience } from "./explore/ComparisonExperience";
import { DisplayControl } from "./DisplayControl";
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
 * around it. Toolbar entries for Decision Breakdown/Display Control/What
 * If/Priorities are added by later Decision Room PRs as each ships, rather
 * than stubbed here ahead of time.
 */
export function DecisionRoomComparison({
  pack,
  scored,
  onBack,
}: {
  pack: IndustryPack;
  scored: ScoredItem[];
  onBack: () => void;
}) {
  const session = useSession();
  const atCap = session.compareItemIds.length >= MAX_COMPARE;
  const [displayControlFor, setDisplayControlFor] = useState<ScoredItem | null>(null);

  return (
    <div className="bg-aurora min-h-screen px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shortlist
        </button>

        <ComparisonExperience pack={pack} scored={scored} onDisplayControl={setDisplayControlFor} />

        {atCap && (
          <p className="mt-4 text-center text-xs text-ink-faint">
            Comparing {MAX_COMPARE} at a time in the Decision Room — remove one to add another.
          </p>
        )}
      </div>

      {displayControlFor && (
        <DisplayControl item={displayControlFor} onClose={() => setDisplayControlFor(null)} />
      )}
    </div>
  );
}

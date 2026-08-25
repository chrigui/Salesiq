"use client";

import { useMemo, useState } from "react";
import { GitCompareArrows, Compass } from "lucide-react";
import { useSession } from "@/core/store/session";
import { useLivePack } from "@/core/store/packs";
import { useScoredInventory } from "./discoveryScoring";
import { useMeetingFlow } from "./meetingFlow";
import { PropertyCard } from "./explore/PropertyCard";
import { PropertyPreview } from "./explore/PropertyPreview";
import { PropertyDetails } from "./explore/PropertyDetails";
import { ProgressJourney } from "./explore/ProgressJourney";
import { DecisionRoomComparison } from "./DecisionRoomComparison";
import { PrioritiesPanel } from "./PrioritiesPanel";
import type { ScoredItem } from "@/core/engine/scoring";
import type { IndustryPack } from "@/core/types";

type DecisionRoomStep = "enter" | "compare" | "priorities" | "recommend";

/** Decision Room supports 2-4 properties in a comparison (spec section 3). */
const MAX_COMPARE = 4;

/**
 * The Decision Room — where the salesperson stops browsing and starts
 * guiding the customer toward a decision. A distinct Companion screen (not
 * a 5th PropertyExplorer tab) reached once 2-5 properties are shortlisted,
 * with its own focused sub-navigation. Reads the same real session.bookmarks
 * and useScoredInventory() every other screen uses — never a second data
 * source. Step is Companion-local (not synced), matching PropertyExplorer's
 * own tab-state split: the real, synced data lives entirely in session.ts.
 */
export function DecisionRoom() {
  const session = useSession();
  const pack = useLivePack(session.packId);
  const flow = useMeetingFlow();
  const scored = useScoredInventory(pack);

  const [step, setStep] = useState<DecisionRoomStep>("enter");

  const shortlisted = useMemo(
    () => scored.filter((s) => session.bookmarks.includes(s.item.id)),
    [scored, session.bookmarks],
  );

  const journey = (
    <ProgressJourney stage={flow.stage} compareCount={session.compareItemIds.length} hasProposal={Boolean(session.proposalText)} />
  );

  if (step === "enter") {
    return (
      <EnterStep
        journey={journey}
        shortlisted={shortlisted}
        pack={pack}
        onCompare={() => {
          // Seed the comparison group from the shortlist itself (capped at
          // MAX_COMPARE) rather than whatever compareItemIds happened to
          // hold from an earlier Explorer session — "Compare" from the
          // Decision Room's entering screen means "compare my shortlist."
          session.clearCompare();
          shortlisted.slice(0, MAX_COMPARE).forEach((s) => session.addToCompare(s.item.id));
          session.setView("compareGroup");
          setStep("compare");
        }}
        onExplore={() => flow.goTo("explore")}
      />
    );
  }

  if (step === "compare") {
    return (
      <DecisionRoomComparison
        pack={pack}
        scored={scored}
        onBack={() => setStep("enter")}
        onShowPriorities={() => setStep("priorities")}
      />
    );
  }

  if (step === "priorities") {
    const group = scored.filter((s) => session.compareItemIds.includes(s.item.id));
    return <PrioritiesPanel pack={pack} group={group} onBack={() => setStep("compare")} />;
  }

  // "recommend" step is filled in over the next Decision Room PR — this
  // stub keeps the step reachable and gives a way back rather than a dead end.
  return (
    <div className="bg-aurora flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      {journey}
      <p className="text-sm text-ink-faint">This part of the Decision Room is being built.</p>
      <button
        onClick={() => setStep("enter")}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-ink-muted transition hover:bg-white/10"
      >
        Back to shortlist
      </button>
    </div>
  );
}

function EnterStep({
  journey,
  shortlisted,
  pack,
  onCompare,
  onExplore,
}: {
  journey: React.ReactNode;
  shortlisted: ScoredItem[];
  pack: IndustryPack;
  onCompare: () => void;
  onExplore: () => void;
}) {
  const [selected, setSelected] = useState<ScoredItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="bg-aurora min-h-screen px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-3">{journey}</div>
        <h1 className="text-xl font-semibold text-ink">Your shortlist</h1>
        <p className="mt-0.5 text-xs text-ink-faint">
          We&rsquo;ve narrowed it down to the properties that best fit what matters to you.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shortlisted.map((s) => (
            <PropertyCard
              key={s.item.id}
              pack={pack}
              scored={s}
              onSelect={() => {
                setSelected(s);
                setDetailsOpen(false);
              }}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={onCompare}
            className="flex items-center gap-1.5 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <GitCompareArrows className="h-4 w-4" />
            Compare
          </button>
          <button
            onClick={onExplore}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-ink-muted transition hover:bg-white/10"
          >
            <Compass className="h-4 w-4" />
            Explore
          </button>
        </div>
      </div>

      {selected && !detailsOpen && (
        <PropertyPreview
          pack={pack}
          scored={selected}
          onBack={() => setSelected(null)}
          onMoreDetails={() => setDetailsOpen(true)}
        />
      )}
      {selected && detailsOpen && (
        <PropertyDetails pack={pack} scored={selected} onBack={() => setDetailsOpen(false)} />
      )}
    </div>
  );
}

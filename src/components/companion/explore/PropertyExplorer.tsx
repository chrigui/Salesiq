"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Settings2 } from "lucide-react";
import { useSession } from "@/core/store/session";
import { useLivePack } from "@/core/store/packs";
import { useScoredInventory } from "../discoveryScoring";
import { useMeetingFlow } from "../meetingFlow";
import { PropertyGrid } from "./PropertyGrid";
import { cx } from "@/components/ui/primitives";
import type { ScoredItem } from "@/core/engine/scoring";

type ExploreTab = "matches" | "all" | "shortlist" | "compare";

const TABS: { id: ExploreTab; label: string }[] = [
  { id: "matches", label: "Matches" },
  { id: "all", label: "All properties" },
  { id: "shortlist", label: "Shortlist" },
  { id: "compare", label: "Compare" },
];

/**
 * The Property Discovery Experience — the real destination of "Look at your
 * matches." A focused, tabbed results explorer, distinct from the full
 * `CompanionApp` workspace (still reachable via "Full toolset" for a
 * salesperson who deliberately wants it, never something discovery pushes
 * them into). Everything here reads from the same real scoreInventory the
 * wizard/confirmation screens already used — never a second engine.
 */
export function PropertyExplorer() {
  const session = useSession();
  const pack = useLivePack(session.packId);
  const flow = useMeetingFlow();
  const scored = useScoredInventory(pack);

  const [tab, setTab] = useState<ExploreTab>("matches");
  const [searchQuery, setSearchQuery] = useState("");

  const matches = useMemo(() => scored.filter((s) => s.score > 0), [scored]);

  const handleSelect = (s: ScoredItem) => {
    // Real, existing mechanism: focuses the item and already pushes it onto
    // the paired Customer Display. The full focused Property Preview lands
    // in a later stage of this build; this keeps the tap meaningful today.
    session.focusItem(s.item.id);
  };

  return (
    <div className="bg-aurora min-h-screen px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink">Your matches</h1>
            <p className="mt-0.5 text-xs text-ink-faint">
              We found {matches.length} propert{matches.length === 1 ? "y" : "ies"} that fit what matters to{" "}
              {session.customer.name.split(" ")[0] || "them"}.
            </p>
          </div>
          <button
            onClick={() => flow.goTo("workspace")}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Full toolset
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 overflow-x-auto">
          <div className="glass flex shrink-0 gap-1 rounded-full p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                  tab === t.id ? "bg-brand text-white" : "text-ink-muted hover:bg-white/5",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
            title="Filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>

        {tab === "all" && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-ink-faint" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        )}

        <div className="mt-5">
          {tab === "matches" && (
            <PropertyGrid
              pack={pack}
              scored={matches}
              searchQuery=""
              onSelect={handleSelect}
              onViewAll={() => setTab("all")}
              onStartOver={() => flow.goTo("discover")}
            />
          )}
          {tab === "all" && (
            <PropertyGrid pack={pack} scored={scored} searchQuery={searchQuery} onSelect={handleSelect} />
          )}
          {tab === "shortlist" && (
            <div className="glass-strong rounded-[1.6rem] p-8 text-center text-sm text-ink-faint ring-1 ring-white/10">
              Nothing shortlisted yet — tap a property and add it to build your shortlist here.
            </div>
          )}
          {tab === "compare" && (
            <div className="glass-strong rounded-[1.6rem] p-8 text-center text-sm text-ink-faint ring-1 ring-white/10">
              Drag two properties together in Matches or All Properties to start a comparison.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Settings2 } from "lucide-react";
import { useSession } from "@/core/store/session";
import { useLivePack } from "@/core/store/packs";
import { logBuyerActivity } from "@/core/store/buyerProfiles";
import { narrativeForMatchCount } from "@/core/engine/explain";
import { useScoredInventory } from "../discoveryScoring";
import { useMeetingFlow } from "../meetingFlow";
import { PropertyGrid } from "./PropertyGrid";
import { FilterSheet } from "./FilterSheet";
import { PropertyPreview } from "./PropertyPreview";
import { PropertyDetails } from "./PropertyDetails";
import { ShortlistTab } from "./ShortlistTab";
import { CompareTab } from "./CompareTab";
import { cx } from "@/components/ui/primitives";
import type { ScoredItem } from "@/core/engine/scoring";
import {
  type ExploreFilters,
  emptyFilters,
  hasActiveFilters,
  applyFilters,
  mostRestrictiveFilter,
  withoutFilter,
} from "./filterEngine";

type ExploreTab = "matches" | "all" | "shortlist" | "compare";

const TABS: { id: ExploreTab; label: string }[] = [
  { id: "matches", label: "Matches" },
  { id: "all", label: "All properties" },
  { id: "shortlist", label: "Shortlist" },
  { id: "compare", label: "Compare" },
];

function activeFilterCount(f: ExploreFilters): number {
  return (
    f.propertyTypes.length +
    f.bedrooms.length +
    (f.price ? 1 : 0) +
    f.locations.length +
    f.features.length +
    (f.status ? 1 : 0)
  );
}

/**
 * The Property Discovery Experience — the real destination of "Look at your
 * matches." A focused, tabbed results explorer, distinct from the full
 * `CompanionApp` workspace (still reachable via "Full toolset" for a
 * salesperson who deliberately wants it, never something discovery pushes
 * them into). Everything here reads from the same real scoreInventory the
 * wizard/confirmation screens already used — never a second engine. Filters
 * are Companion-local and scoped to this meeting only — never written to
 * the synced Buyer Profile.
 */
export function PropertyExplorer() {
  const session = useSession();
  const pack = useLivePack(session.packId);
  const flow = useMeetingFlow();
  const scored = useScoredInventory(pack);

  const [tab, setTab] = useState<ExploreTab>("matches");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ExploreFilters>(emptyFilters());
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selected, setSelected] = useState<ScoredItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const matches = useMemo(() => scored.filter((s) => s.score > 0), [scored]);
  const activeList = tab === "all" ? scored : matches;
  const filtered = useMemo(() => applyFilters(pack, activeList, filters), [pack, activeList, filters]);

  const handleSelect = (s: ScoredItem) => {
    setSelected(s);
    setDetailsOpen(false);
    if (session.buyerProfileId) {
      void logBuyerActivity(session.buyerProfileId, { kind: "property_viewed", packId: pack.id, itemId: s.item.id });
    }
  };

  const relaxRequirements = () => {
    const worst = mostRestrictiveFilter(pack, activeList, filters);
    if (worst) setFilters(withoutFilter(filters, worst));
  };

  const headerText =
    hasActiveFilters(filters) || searchQuery.trim()
      ? narrativeForMatchCount(filtered.length, activeList.length) ||
        `${filtered.length} propert${filtered.length === 1 ? "y" : "ies"} match.`
      : `We found ${matches.length} propert${matches.length === 1 ? "y" : "ies"} that fit what matters to ${
          session.customer.name.split(" ")[0] || "them"
        }.`;

  return (
    <div className="bg-aurora min-h-screen px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink">Your matches</h1>
            <p className="mt-0.5 text-xs text-ink-faint">{headerText}</p>
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
            onClick={() => setFilterSheetOpen(true)}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
            title="Filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {activeFilterCount(filters) > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-brand text-[10px] font-semibold text-white">
                {activeFilterCount(filters)}
              </span>
            )}
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
              scored={filtered}
              searchQuery=""
              onSelect={handleSelect}
              onRelaxRequirements={hasActiveFilters(filters) ? relaxRequirements : undefined}
              onViewAll={() => setTab("all")}
              onStartOver={() => flow.goTo("discover")}
              onOpenCompare={() => setTab("compare")}
            />
          )}
          {tab === "all" && (
            <PropertyGrid
              pack={pack}
              scored={filtered}
              searchQuery={searchQuery}
              onSelect={handleSelect}
              onRelaxRequirements={hasActiveFilters(filters) ? relaxRequirements : undefined}
              onStartOver={() => flow.goTo("discover")}
              onOpenCompare={() => setTab("compare")}
            />
          )}
          {tab === "shortlist" && <ShortlistTab pack={pack} scored={scored} onSelect={handleSelect} />}
          {tab === "compare" && <CompareTab pack={pack} scored={scored} />}
        </div>
      </div>

      {filterSheetOpen && (
        <FilterSheet pack={pack} filters={filters} onChange={setFilters} onClose={() => setFilterSheetOpen(false)} />
      )}

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

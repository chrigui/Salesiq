"use client";

import { useMemo } from "react";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { useSession } from "@/core/store/session";
import { PropertyCard } from "./PropertyCard";

/**
 * The salesperson/customer-curated shortlist — reuses the existing
 * `session.bookmarks` array as-is (already synced Companion<->Display,
 * already the default item set `ProposalSheet` reads), resolved against
 * the same real `scored` array every other tab uses so the score/reasons
 * shown here are never a second, re-derived number.
 */
export function ShortlistTab({
  pack,
  scored,
  onSelect,
}: {
  pack: IndustryPack;
  scored: ScoredItem[];
  onSelect: (item: ScoredItem) => void;
}) {
  const session = useSession();
  const shortlisted = useMemo(
    () => scored.filter((s) => session.bookmarks.includes(s.item.id)),
    [scored, session.bookmarks],
  );

  if (shortlisted.length === 0) {
    return (
      <div className="glass-strong rounded-[1.6rem] p-8 text-center text-sm text-ink-faint ring-1 ring-white/10">
        Nothing shortlisted yet — tap a property and add it to build your shortlist here.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Shortlist · {shortlisted.length}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shortlisted.map((s) => (
          <PropertyCard key={s.item.id} pack={pack} scored={s} onSelect={() => onSelect(s)} />
        ))}
      </div>
    </div>
  );
}

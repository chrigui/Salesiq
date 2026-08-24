"use client";

import { useMemo } from "react";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { PropertyCard } from "./PropertyCard";
import { EmptyMatchesState } from "./EmptyMatchesState";

/** Plain client-side text filter over already-scored items — name, subtitle,
 * location, and the pack's own propertyType option labels. Not a second
 * search/filter engine: it never touches scoring, just narrows which of the
 * already-real scored items render. */
function matchesSearch(scored: ScoredItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const { item } = scored;
  return (
    item.name.toLowerCase().includes(q) ||
    item.subtitle.toLowerCase().includes(q) ||
    (item.location?.label.toLowerCase().includes(q) ?? false) ||
    item.id.toLowerCase().includes(q)
  );
}

export function PropertyGrid({
  pack,
  scored,
  searchQuery,
  onSelect,
  onRelaxRequirements,
  onViewAll,
  onStartOver,
}: {
  pack: IndustryPack;
  scored: ScoredItem[];
  searchQuery: string;
  onSelect: (item: ScoredItem) => void;
  onRelaxRequirements?: () => void;
  onViewAll?: () => void;
  onStartOver?: () => void;
}) {
  const visible = useMemo(
    () => scored.filter((s) => matchesSearch(s, searchQuery)),
    [scored, searchQuery],
  );

  if (visible.length === 0) {
    return (
      <EmptyMatchesState
        onRelaxRequirements={onRelaxRequirements}
        onViewAll={onViewAll}
        onStartOver={onStartOver}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {visible.map((s) => (
        <PropertyCard key={s.item.id} pack={pack} scored={s} onSelect={() => onSelect(s)} />
      ))}
    </div>
  );
}

"use client";

import { useCallback, useMemo, useRef } from "react";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { useSession } from "@/core/store/session";
import { PropertyCard } from "./PropertyCard";
import { DraggableCard } from "./DraggableCard";
import { CompareFolderTile } from "./CompareFolderTile";
import { EmptyMatchesState } from "./EmptyMatchesState";

/** Plain client-side text filter over already-scored items — name, subtitle,
 * location, and the pack's own propertyType option labels. Not a second
 * search/filter engine: it never touches scoring, just narrows which of the
 * already-real scored items render. */
/** Sentinel ref key for the collapsed comparison-group folder tile, so
 * dropping a third card onto it (rather than onto another solo card) is
 * detected by the same hit-test loop instead of being silently ignored. */
const FOLDER_DROP_KEY = "__compare-folder__";

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
  onOpenCompare,
  enableDrag = true,
}: {
  pack: IndustryPack;
  scored: ScoredItem[];
  searchQuery: string;
  onSelect: (item: ScoredItem) => void;
  onRelaxRequirements?: () => void;
  onViewAll?: () => void;
  onStartOver?: () => void;
  /** Present so the grid can collapse an active comparison group into a folder tile. */
  onOpenCompare?: () => void;
  /** Off for grids that shouldn't offer drag-to-compare (e.g. none today, but keeps the option real rather than baked in). */
  enableDrag?: boolean;
}) {
  const session = useSession();
  const refs = useRef(new Map<string, HTMLDivElement>());

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  }, []);

  const handleDragEnd = useCallback(
    (draggedId: string, point: { x: number; y: number }) => {
      for (const [id, el] of refs.current) {
        if (id === draggedId) continue;
        const rect = el.getBoundingClientRect();
        if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
          if (id === FOLDER_DROP_KEY) {
            session.addToCompare(draggedId);
          } else {
            session.addToCompare(draggedId);
            session.addToCompare(id);
          }
          return;
        }
      }
    },
    [session],
  );

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

  const compareIds = session.compareItemIds;
  const solo = visible.filter((s) => !compareIds.includes(s.item.id));
  const showFolder = compareIds.length >= 2 && Boolean(onOpenCompare);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {showFolder && onOpenCompare && (
        <div ref={(el) => registerRef(FOLDER_DROP_KEY, el)}>
          <CompareFolderTile scored={scored} itemIds={compareIds} onOpen={onOpenCompare} />
        </div>
      )}
      {solo.map((s) =>
        enableDrag ? (
          <DraggableCard
            key={s.item.id}
            pack={pack}
            scored={s}
            onSelect={() => onSelect(s)}
            registerRef={(el) => registerRef(s.item.id, el)}
            onDragEnd={(point) => handleDragEnd(s.item.id, point)}
          />
        ) : (
          <PropertyCard key={s.item.id} pack={pack} scored={s} onSelect={() => onSelect(s)} />
        ),
      )}
    </div>
  );
}

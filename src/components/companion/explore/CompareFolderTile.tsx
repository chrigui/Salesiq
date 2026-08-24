"use client";

import { GitCompareArrows } from "lucide-react";
import type { ScoredItem } from "@/core/engine/scoring";
import { ItemImage } from "@/components/ui/ItemImage";

/**
 * The collapsed "folder" a comparison group renders as inside the grid —
 * stacked real thumbnails, tap to open the full Comparison Experience.
 * Mirrors the familiar "drag one app onto another to make a folder"
 * gesture the drag handler in PropertyGrid implements.
 */
export function CompareFolderTile({
  scored,
  itemIds,
  onOpen,
}: {
  scored: ScoredItem[];
  itemIds: string[];
  onOpen: () => void;
}) {
  const items = itemIds
    .map((id) => scored.find((s) => s.item.id === id)?.item)
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  return (
    <button
      onClick={onOpen}
      className="glass-strong flex flex-col items-center justify-center gap-3 rounded-[1.6rem] p-6 text-center ring-2 ring-brand/40 transition hover:ring-brand/70"
    >
      <div className="flex -space-x-4">
        {items.slice(0, 3).map((item, i) => (
          <div key={item.id} style={{ zIndex: 3 - i }}>
            <ItemImage
              image={item.image}
              photo={item.photo}
              className="h-14 w-14 rounded-2xl ring-2 ring-[rgb(var(--surface))]"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <GitCompareArrows className="h-4 w-4 text-brand" />
        {items.length} propert{items.length === 1 ? "y" : "ies"} · Compare
      </div>
      <p className="text-xs text-ink-faint">Tap to open the comparison</p>
    </button>
  );
}

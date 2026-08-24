"use client";

import { SearchX } from "lucide-react";

/**
 * Shown whenever the current tab/search/filter combination has nothing to
 * show — never a bare blank grid. Each action is optional so callers can
 * offer only what's actually meaningful in their context (e.g. "View all
 * properties" doesn't make sense while already on that tab).
 */
export function EmptyMatchesState({
  onRelaxRequirements,
  onViewAll,
  onStartOver,
}: {
  onRelaxRequirements?: () => void;
  onViewAll?: () => void;
  onStartOver?: () => void;
}) {
  return (
    <div className="glass-strong flex flex-col items-center gap-4 rounded-[1.6rem] p-8 text-center ring-1 ring-white/10">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-white/5 text-ink-faint">
        <SearchX className="h-6 w-6" />
      </div>
      <div>
        <div className="text-sm font-semibold text-ink">We couldn&apos;t find a perfect match</div>
        <p className="mt-1 text-xs text-ink-faint">Try relaxing a requirement, or browse everything we have.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {onRelaxRequirements && (
          <button
            onClick={onRelaxRequirements}
            className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Relax requirements
          </button>
        )}
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-ink-muted transition hover:bg-white/10"
          >
            View all properties
          </button>
        )}
        {onStartOver && (
          <button
            onClick={onStartOver}
            className="rounded-full px-4 py-2 text-xs font-medium text-ink-faint transition hover:bg-white/5"
          >
            Start over
          </button>
        )}
      </div>
    </div>
  );
}

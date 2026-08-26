"use client";

import { cx } from "@/components/ui/primitives";
import { countRecapEventsFromBuyerActivity, deriveRecapEngagement, type RecapEngagementLevel } from "@/lib/recaps/signals";

const LEVEL_STYLE: Record<RecapEngagementLevel, string> = {
  "No activity yet": "bg-zinc-100 text-zinc-500",
  "Light engagement": "bg-sky-100 text-sky-700",
  "Moderate engagement": "bg-amber-100 text-amber-700",
  "Strong engagement": "bg-emerald-100 text-emerald-700",
};

/** A single-glance read on how much a buyer has engaged with their LUMMA Recap — reuses deriveRecapEngagement (PR15) so this badge and the owner analytics view never disagree about what "strong" means. */
export function RecapEngagementBadge({ kinds }: { kinds: string[] }) {
  if (kinds.length === 0) return null;
  const { level } = deriveRecapEngagement(countRecapEventsFromBuyerActivity(kinds));
  if (level === "No activity yet") return null;

  return (
    <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", LEVEL_STYLE[level])}>
      {level}
    </span>
  );
}

import { Sparkles } from "lucide-react";
import { PriceUpdatedBadge } from "./PriceUpdatedBadge";
import { StatusUpdatedBadge } from "./StatusUpdatedBadge";
import type { RecapDiff } from "@/lib/recaps/diff";

/**
 * Spec section 38's "SINCE YOUR LAST VISIT" — shown only when something
 * real actually changed (diff.hasChanges), listing exactly the changes
 * computeRecapDiff found. Never rendered on a first-ever view.
 */
export function SinceYourLastVisit({ diff }: { diff: RecapDiff }) {
  if (!diff.hasChanges) return null;

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
        <Sparkles className="h-3.5 w-3.5" />
        Since your last visit
      </div>
      <div className="flex flex-wrap gap-1.5">
        {diff.priceChanges.map((change) => (
          <PriceUpdatedBadge key={`price-${change.itemId}`} change={change} />
        ))}
        {diff.availabilityChanges.map((change) => (
          <StatusUpdatedBadge key={`avail-${change.itemId}`} change={change} />
        ))}
      </div>
    </div>
  );
}

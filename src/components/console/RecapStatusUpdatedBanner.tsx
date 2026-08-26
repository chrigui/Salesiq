"use client";

import { AlertTriangle, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { formatMoney } from "@/core/engine/explain";
import { useRecapStatus } from "@/core/store/buyerProfiles";

/**
 * Spec's "CUSTOMER'S SHORTLISTED PROPERTY UPDATED" banner — surfaces the
 * moment a buyer's live Recap drifts from what was shown at the meeting,
 * with zero dependency on the customer ever having reopened it (PR17's
 * recap-status route diffs against the frozen creation-time snapshot, not
 * the customer's last real view). Reuses PR11's RecapDiff shape directly;
 * no diff logic lives here, only presentation.
 */
export function RecapStatusUpdatedBanner({ buyerProfileId }: { buyerProfileId: string }) {
  const { diff } = useRecapStatus(buyerProfileId);
  if (!diff || !diff.hasChanges) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Customer&apos;s shortlisted property updated
      </div>
      <div className="flex flex-wrap gap-2">
        {diff.priceChanges.map((change) => {
          const Icon = change.direction === "up" ? TrendingUp : TrendingDown;
          return (
            <div
              key={`price-${change.itemId}`}
              className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-800"
            >
              <Icon className={change.direction === "up" ? "h-3 w-3 text-amber-600" : "h-3 w-3 text-emerald-600"} />
              {change.itemName}: {formatMoney(change.previousPrice, change.currency)} →{" "}
              {formatMoney(change.currentPrice, change.currency)}
            </div>
          );
        })}
        {diff.availabilityChanges.map((change) => (
          <div
            key={`avail-${change.itemId}`}
            className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-800"
          >
            <RefreshCw className="h-3 w-3 text-amber-600" />
            {change.itemName}: {change.previousAvailability ?? "Available"} → {change.currentAvailability ?? "Available"}
          </div>
        ))}
      </div>
    </div>
  );
}

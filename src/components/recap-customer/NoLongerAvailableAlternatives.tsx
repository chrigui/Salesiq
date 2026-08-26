import { AlertCircle } from "lucide-react";
import { formatMoney } from "@/core/engine/explain";
import { nearestComparables } from "@/lib/comparables";
import { toCustomerSafeItem } from "@/lib/customerSafe";
import type { IndustryPack, InventoryItem } from "@/core/types";

/**
 * Spec sections 17-18: an item that's genuinely gone (Reserved/Booked/Sold)
 * is shown honestly, framed as the living experience continuing rather
 * than a broken link, with real closest alternatives from the same live
 * pack — never a second inventory system, never a fabricated substitute.
 * A Server Component deliberately: nearestComparables needs the full pack
 * (real scoring-rule functions live on it), which can only be passed here
 * because the caller (RecapExperienceView) is itself a Server Component.
 */
export function NoLongerAvailableAlternatives({
  pack,
  item,
  currentAvailability,
}: {
  pack: IndustryPack;
  item: InventoryItem;
  currentAvailability: string | null;
}) {
  const alternatives = nearestComparables(pack.inventory, item, 3).map(toCustomerSafeItem);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
        <AlertCircle className="h-3.5 w-3.5" />
        No longer available
      </div>
      <div className="text-sm font-medium text-ink">{item.name}</div>
      <div className="text-xs text-ink-faint">Now {currentAvailability ?? "unavailable"}</div>

      {alternatives.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Closest current alternatives
          </div>
          <div className="space-y-1.5">
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
              >
                <span className="text-xs text-ink-muted">{alt.name}</span>
                <span className="text-xs font-semibold text-brand">{formatMoney(alt.price, alt.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

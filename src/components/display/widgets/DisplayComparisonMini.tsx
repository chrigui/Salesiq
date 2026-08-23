import { formatMoney } from "@/core/engine/explain";
import { ItemImage } from "@/components/ui/ItemImage";
import type { DisplayWidgetContext } from "../types";

/** The single nearest comparable (by price/attribute proximity) — real inventory data, never an invented comp. */
export function DisplayComparisonMini({ comparables, mode }: DisplayWidgetContext) {
  const nearest = comparables[0];

  if (!nearest) {
    if (mode === "preview") {
      return (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center">
          <p className="text-xs text-white/40">No comparable listings in this pack yet.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center gap-3 p-3">
        <ItemImage image={nearest.image} photo={nearest.photo} className="h-14 w-14 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">Also consider</div>
          <div className="truncate text-sm font-medium text-white">{nearest.name}</div>
          <div className="text-xs text-white/60">{formatMoney(nearest.price, nearest.currency)}</div>
        </div>
      </div>
    </div>
  );
}

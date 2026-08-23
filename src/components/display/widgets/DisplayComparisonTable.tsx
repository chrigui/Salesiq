import { formatMoney } from "@/core/engine/explain";
import { ItemImage } from "@/components/ui/ItemImage";
import type { DisplayWidgetContext } from "../types";

/** Compact card variant of DisplayComparables — same real nearestComparables() data, capped to fit a grid card. */
export function DisplayComparisonTable({ comparables, mode }: DisplayWidgetContext) {
  const rows = comparables.slice(0, 3);

  if (rows.length === 0) {
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Comparable listings</div>
      <div className="space-y-2">
        {rows.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            <ItemImage image={c.image} photo={c.photo} className="h-10 w-10 shrink-0 rounded-lg" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/80">{c.name}</span>
            <span className="shrink-0 text-xs text-white/50">{formatMoney(c.price, c.currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { formatMoney } from "@/core/engine/explain";
import { ItemImage } from "@/components/ui/ItemImage";
import type { DisplayWidgetContext } from "../types";

export function DisplayComparables({ comparables }: DisplayWidgetContext) {
  if (comparables.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <h2 className="mb-4 text-lg font-semibold text-white">Comparable listings</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {comparables.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-2xl border border-white/10">
            <ItemImage image={c.image} photo={c.photo} className="h-28" />
            <div className="p-3">
              <div className="truncate text-sm font-medium text-white">{c.name}</div>
              <div className="text-xs text-white/60">{formatMoney(c.price, c.currency)}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

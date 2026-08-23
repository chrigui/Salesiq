import { ItemImage } from "@/components/ui/ItemImage";
import { formatMoney } from "@/core/engine/explain";
import type { DisplayWidgetContext } from "../types";

/** Compact card variant of DisplayHero — a small property tile instead of a full-bleed section, for the Grid layout. */
export function DisplayHeroCard({ item }: DisplayWidgetContext) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <ItemImage image={item.image} photo={item.photo} className="h-40 w-full" />
      <div className="p-4">
        <div className="truncate text-lg font-semibold text-white">{item.name}</div>
        {item.subtitle && <div className="truncate text-xs text-white/60">{item.subtitle}</div>}
        <div className="mt-1.5 text-xl font-semibold text-brand">{formatMoney(item.price, item.currency)}</div>
      </div>
    </div>
  );
}

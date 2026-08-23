import { Tag } from "lucide-react";
import { formatMoney } from "@/core/engine/explain";
import type { DisplayWidgetContext } from "../types";

/** Price/sqm only appears when lifestyle.sqm is set — never estimated from an unrelated attribute. */
export function DisplayPriceSummary({ item }: DisplayWidgetContext) {
  const sqm = item.lifestyle?.sqm;
  const perSqm = sqm ? Math.round(item.price / sqm) : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">
        <Tag className="h-3.5 w-3.5" /> Price
      </div>
      <div className="text-2xl font-semibold text-white">{formatMoney(item.price, item.currency)}</div>
      {perSqm != null && (
        <div className="mt-1 text-xs text-white/50">{formatMoney(perSqm, item.currency)} / m²</div>
      )}
    </div>
  );
}

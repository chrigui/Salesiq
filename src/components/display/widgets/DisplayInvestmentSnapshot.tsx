import { TrendingUp } from "lucide-react";
import { formatMoney } from "@/core/engine/explain";
import type { DisplayWidgetContext } from "../types";

/**
 * Compact card variant of DisplayInvestment, with the same illustrative
 * 5-yr projection formula LifestyleMap's InvestmentOutlook uses (straight-line
 * from the real 3-yr appreciation figure — never a fabricated valuation).
 */
export function DisplayInvestmentSnapshot({ item }: DisplayWidgetContext) {
  if (item.appreciation == null) return null;

  const appr = item.appreciation;
  const projected = Math.round((item.price * (1 + (appr / 100) * (5 / 3))) / 1000) * 1000;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">
        <TrendingUp className="h-3.5 w-3.5" /> Investment snapshot
      </div>
      <div className="text-2xl font-semibold text-white">+{appr}%</div>
      <div className="text-[11px] text-white/50">3-yr appreciation</div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-white/50">Projected 5-yr value</span>
        <span className="font-medium text-white">{formatMoney(projected, item.currency)}</span>
      </div>
      <p className="mt-2 text-[10px] text-white/40">Illustrative straight-line projection — not a valuation.</p>
    </div>
  );
}

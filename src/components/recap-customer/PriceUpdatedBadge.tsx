import { TrendingDown, TrendingUp } from "lucide-react";
import { formatMoney } from "@/core/engine/explain";
import type { RecapPriceChange } from "@/lib/recaps/diff";

/** Spec sections 15-16 — an honest previous-vs-current price line, never a hidden change or fake urgency. */
export function PriceUpdatedBadge({ change }: { change: RecapPriceChange }) {
  const Icon = change.direction === "up" ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-ink-muted">
      <Icon className={change.direction === "up" ? "h-3 w-3 text-amber-400" : "h-3 w-3 text-emerald-400"} />
      <span className="uppercase tracking-wide">Price updated</span>
      <span className="text-ink-faint line-through">{formatMoney(change.previousPrice, change.currency)}</span>
      <span>{formatMoney(change.currentPrice, change.currency)}</span>
    </div>
  );
}

import { GitCompareArrows } from "lucide-react";
import { formatMoney } from "@/core/engine/explain";
import type { PublicRecapComparedProperties } from "@/lib/recaps/resolve";

/**
 * Spec section 20's Comparison Continuity — "YOU COMPARED A/B/C" preserved
 * exactly as it stood at the end of the meeting. `differences` were frozen
 * by buildRecapSnapshot() from whyNotReasons() at creation time and are
 * rendered here verbatim; this block never re-runs the comparison or
 * resets it on reopen. `items` are still resolved live (so price/name stay
 * current), but which properties were compared and why never changes.
 */
export function RecapComparisonBlock({ compared }: { compared: PublicRecapComparedProperties }) {
  if (compared.items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        <GitCompareArrows className="h-3.5 w-3.5 text-brand" />
        You compared {compared.items.map((i) => i.name).join(", ")}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {compared.items.map((item) => (
          <div
            key={item.id}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-ink-muted"
          >
            {item.name} · {formatMoney(item.price, item.currency)}
          </div>
        ))}
      </div>

      {compared.differences.length > 0 && (
        <ul className="space-y-1.5">
          {compared.differences.map((difference, i) => (
            <li key={i} className="text-xs text-ink-muted">
              {difference}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

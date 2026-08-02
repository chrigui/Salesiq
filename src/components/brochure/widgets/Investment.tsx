import { formatMoney } from "@/core/engine/explain";
import { cx } from "@/components/ui/primitives";
import { ItemImage } from "@/components/ui/ItemImage";
import type { BrochureWidgetContext } from "../types";

export function Investment({ item, comparables, dark }: BrochureWidgetContext) {
  if (!item.appreciation && comparables.length === 0) return null;

  const ink = dark ? "text-white" : "text-zinc-900";
  const muted = dark ? "text-white/60" : "text-zinc-500";
  const border = dark ? "border-white/10" : "border-zinc-200";

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
      <h2 className={cx("mb-4 text-lg font-semibold", ink)}>Investment</h2>

      {item.appreciation != null && (
        <div className={cx("mb-6 rounded-2xl border p-5", border)}>
          <div className={cx("text-3xl font-semibold", ink)}>+{item.appreciation}%</div>
          <div className={cx("text-xs", muted)}>3-yr appreciation</div>
          <p className={cx("mt-2 text-xs", muted)}>
            Illustrative straight-line projection from the 3-year trend — not a valuation.
          </p>
        </div>
      )}

      {comparables.length > 0 && (
        <>
          <h3 className={cx("mb-3 text-sm font-semibold", ink)}>Comparable listings</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {comparables.map((c) => (
              <div key={c.id} className={cx("overflow-hidden rounded-2xl border", border)}>
                <ItemImage image={c.image} photo={c.photo} className="h-28" />
                <div className="p-3">
                  <div className={cx("truncate text-sm font-medium", ink)}>{c.name}</div>
                  <div className={cx("text-xs", muted)}>{formatMoney(c.price, c.currency)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

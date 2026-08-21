import type { DisplayWidgetContext } from "../types";

export function DisplayInvestment({ item }: DisplayWidgetContext) {
  if (item.appreciation == null) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <h2 className="mb-4 text-lg font-semibold text-white">Investment</h2>
      <div className="rounded-2xl border border-white/10 p-5">
        <div className="text-3xl font-semibold text-white">+{item.appreciation}%</div>
        <div className="text-xs text-white/60">3-yr appreciation</div>
        <p className="mt-2 text-xs text-white/60">
          Illustrative straight-line projection from the 3-year trend — not a valuation.
        </p>
      </div>
    </section>
  );
}

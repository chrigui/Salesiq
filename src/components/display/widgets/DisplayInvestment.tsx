import type { DisplayWidgetContext } from "../types";

function readConfig(config: Record<string, unknown> | undefined) {
  return {
    showRoi: config?.showRoi !== false,
    showRentalYield: config?.showRentalYield !== false,
  };
}

export function DisplayInvestment({ item, config }: DisplayWidgetContext) {
  if (item.appreciation == null) return null;

  const { showRoi, showRentalYield } = readConfig(config);
  const roi = typeof item.attributes.roi === "number" ? item.attributes.roi : null;
  const rentalYield = typeof item.attributes.rentalYield === "number" ? item.attributes.rentalYield : null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <h2 className="mb-4 text-lg font-semibold text-white">Investment</h2>
      <div className="rounded-2xl border border-white/10 p-5">
        <div className="text-3xl font-semibold text-white">+{item.appreciation}%</div>
        <div className="text-xs text-white/60">3-yr appreciation</div>
        {((showRoi && roi != null) || (showRentalYield && rentalYield != null)) && (
          <div className="mt-4 flex flex-wrap gap-6 border-t border-white/10 pt-4">
            {showRoi && roi != null && (
              <div>
                <div className="text-lg font-semibold text-white">{roi}%</div>
                <div className="text-[11px] text-white/50">ROI</div>
              </div>
            )}
            {showRentalYield && rentalYield != null && (
              <div>
                <div className="text-lg font-semibold text-white">{rentalYield}%</div>
                <div className="text-[11px] text-white/50">Rental yield</div>
              </div>
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-white/60">
          Illustrative straight-line projection from the 3-year trend — not a valuation.
        </p>
      </div>
    </section>
  );
}

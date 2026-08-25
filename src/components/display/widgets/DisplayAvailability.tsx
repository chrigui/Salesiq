import { Building2 } from "lucide-react";
import type { DisplayWidgetContext } from "../types";

/** Purely admin-entered availability (InventoryBuilder's "Units left"/"Total units"/"Status") — never inferred. */
export function DisplayAvailability({ item, mode }: DisplayWidgetContext) {
  const { unitsLeft, totalUnits, availabilityStatus } = item;

  if (unitsLeft == null && !availabilityStatus) {
    if (mode === "preview") {
      return (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center">
          <p className="text-xs text-white/40">No availability data set for this listing yet.</p>
        </div>
      );
    }
    return null;
  }

  // An explicit Reserved/Booked/Sold status overrides the numeric bar
  // below — it's a real state change (never stale inventory) that a plain
  // "N units left" count can't express on its own.
  if (availabilityStatus && availabilityStatus !== "Available") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">
          <Building2 className="h-3.5 w-3.5" /> Availability
        </div>
        <div className="text-2xl font-semibold text-white">{availabilityStatus}</div>
      </div>
    );
  }

  const pct = totalUnits && unitsLeft != null ? Math.max(0, Math.min(100, Math.round((unitsLeft / totalUnits) * 100))) : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">
        <Building2 className="h-3.5 w-3.5" /> Availability
      </div>
      {unitsLeft != null ? (
        <>
          <div className="text-2xl font-semibold text-white">
            {unitsLeft} {unitsLeft === 1 ? "unit" : "units"} left
          </div>
          {totalUnits != null && (
            <>
              <div className="mt-1 text-xs text-white/50">of {totalUnits} total</div>
              {pct != null && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="text-2xl font-semibold text-white">Available</div>
      )}
    </div>
  );
}

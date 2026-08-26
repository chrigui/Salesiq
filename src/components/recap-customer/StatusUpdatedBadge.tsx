import { RefreshCw } from "lucide-react";
import type { RecapAvailabilityChange } from "@/lib/recaps/diff";

/** Spec section 17 — a subtle, honest status transition, framed as a living experience rather than a system failure. */
export function StatusUpdatedBadge({ change }: { change: RecapAvailabilityChange }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-ink-muted">
      <RefreshCw className="h-3 w-3 text-brand" />
      <span className="uppercase tracking-wide">Status updated</span>
      <span className="text-ink-faint">{change.previousAvailability ?? "Available"}</span>
      <span>→ {change.currentAvailability ?? "Available"}</span>
    </div>
  );
}

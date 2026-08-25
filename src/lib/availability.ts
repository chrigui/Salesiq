import type { InventoryItem } from "@/core/types";

export type AvailabilityStatus = "Available" | "Reserved" | "Booked" | "Sold";

/**
 * `availabilityStatus` (admin-entered, explicit) takes precedence when
 * set — it can express Reserved/Booked/Sold, states `unitsLeft` alone
 * can't distinguish. Falls back to the original `unitsLeft`-derived
 * Available/Sold out inference when no explicit status has been entered.
 * Both paths stay "never inferred beyond what's actually entered" —
 * neither field set means we simply don't know, so every caller must
 * treat `null` as "omit this badge/section entirely," never as a
 * fabricated state.
 */
export function deriveAvailabilityLabel(
  item: Pick<InventoryItem, "unitsLeft" | "availabilityStatus">,
): AvailabilityStatus | "Sold out" | null {
  if (item.availabilityStatus) return item.availabilityStatus;
  if (item.unitsLeft === undefined) return null;
  return item.unitsLeft > 0 ? "Available" : "Sold out";
}

import type { InventoryItem } from "@/core/types";

/**
 * The only real availability signal `InventoryItem` carries today is
 * `unitsLeft` (admin-entered, "never inferred/fabricated" per its own type
 * comment). There is no Reserved/Booked status anywhere in the data model —
 * inventing one here would violate the same rule. `unitsLeft` unset means
 * we simply don't know, so every caller must treat `null` as "omit this
 * badge/section entirely," never as a third fabricated state.
 */
export function deriveAvailabilityLabel(item: Pick<InventoryItem, "unitsLeft">): "Available" | "Sold out" | null {
  if (item.unitsLeft === undefined) return null;
  return item.unitsLeft > 0 ? "Available" : "Sold out";
}

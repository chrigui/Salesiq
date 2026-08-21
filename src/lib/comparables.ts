import type { InventoryItem } from "@/core/types";

/**
 * Nearest N other items in the same pack by price distance, preferring
 * matching property-type attributes when present — real inventory data,
 * never invented market comps. Shared by the Brochure and Display Studio
 * resolvers so "comparable listings" means the same thing everywhere.
 */
export function nearestComparables(inventory: InventoryItem[], item: InventoryItem, limit = 3): InventoryItem[] {
  const sameTypeKeys = Object.keys(item.attributes).filter(
    (k) => typeof item.attributes[k] === "boolean" && item.attributes[k] === true,
  );
  return inventory
    .filter((i) => i.id !== item.id)
    .map((i) => {
      const priceDelta = Math.abs(i.price - item.price) / Math.max(item.price, 1);
      const typeMismatch = sameTypeKeys.some((k) => i.attributes[k] !== true) ? 1 : 0;
      return { item: i, distance: priceDelta + typeMismatch };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((x) => x.item);
}

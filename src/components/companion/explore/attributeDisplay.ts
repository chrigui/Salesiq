/**
 * Generic, pack-agnostic reader for the handful of real-estate-flavored
 * attributes property cards want to show — bedrooms, bathrooms, floor
 * area, property type. `InventoryItem.attributes` is a free-form
 * `Record<string, number|string|boolean>` with different keys per pack
 * (Green Hills: `plotSize`, no `propertyType`; Bahrain: `areaSqm` + a
 * multi-hot boolean per property-type option, no single `propertyType`
 * string). Every field here returns `null` when the pack/item doesn't
 * carry it — never a fabricated placeholder — so the same card renders
 * correctly whether it's real estate, automotive, or private jets.
 */
import type { IndustryPack, InventoryItem } from "@/core/types";

export interface PropertyAttributes {
  bedrooms: number | null;
  bathrooms: number | null;
  /** Living area in m², when the pack tracks it. */
  areaSqm: number | null;
  /** Plot/lot size in m², when the pack tracks it (distinct from living area). */
  plotSize: number | null;
  /** Human label(s), derived from the pack's own propertyType question options. */
  propertyType: string | null;
}

function numberAttr(item: InventoryItem, key: string): number | null {
  const v = item.attributes[key];
  return typeof v === "number" ? v : null;
}

/** Resolves a property-type label from the pack's own `propertyType` question
 * — either a `single`/`multi` question whose answer the item's attributes
 * encode as one boolean per option id (Bahrain's convention), or (for packs
 * with no such data on the item) returns null rather than guessing. */
function derivePropertyType(pack: IndustryPack, item: InventoryItem): string | null {
  const question = pack.questions.find((q) => q.id === "propertyType");
  if (!question?.options) return null;
  const matched = question.options.filter((opt) => item.attributes[opt.id] === true);
  if (matched.length === 0) return null;
  return matched.map((opt) => opt.label).join(", ");
}

export function readPropertyAttributes(pack: IndustryPack, item: InventoryItem): PropertyAttributes {
  return {
    bedrooms: numberAttr(item, "bedrooms"),
    bathrooms: numberAttr(item, "bathrooms"),
    areaSqm: numberAttr(item, "areaSqm"),
    plotSize: numberAttr(item, "plotSize"),
    propertyType: derivePropertyType(pack, item),
  };
}

import type { InventoryItem, IndustryPack } from "@/core/types";
import type { WidgetType } from "./sections";

export interface RelevanceAsset {
  mimeType: string;
}

/**
 * Whether real data on this item/pack could actually back a given widget
 * type — the single source of truth for "would this widget show something
 * real for this listing," shared by the AI suggester's deterministic
 * fallback (core/engine/displayProfileDesign.ts) and the "When relevant"
 * widget-visibility option in Display Studio's editor. Widgets with no
 * concrete data dependency (session-driven or always-on, e.g. hero,
 * aiPromptTicker, leadCapture) fall through to the default of relevant.
 */
export function isWidgetRelevant(
  type: string,
  item: InventoryItem,
  pack: IndustryPack,
  assets: RelevanceAsset[] = [],
): boolean {
  switch (type as WidgetType) {
    case "gallery":
    case "galleryCard":
      return [item.photo, ...(item.gallery ?? [])].filter(Boolean).length > 1;
    case "highlights":
      return item.highlights.length > 0;
    case "specs":
      return Object.keys(item.attributes).length > 0;
    case "neighborhood":
      return Boolean(item.lifestyle);
    case "masterplan":
      return assets.some((a) => a.mimeType.startsWith("image/"));
    case "documents":
    case "documentsCard":
      return assets.length > 0;
    case "investment":
    case "investmentSnapshot":
      return item.appreciation != null;
    case "comparables":
    case "comparisonMini":
    case "comparisonTable":
      return pack.inventory.length > 1;
    case "trustBadges":
      return (
        [item.photo, ...(item.gallery ?? [])].filter(Boolean).length > 1 ||
        assets.length > 0 ||
        Boolean(item.lifestyle) ||
        Object.keys(item.attributes).length > 0
      );
    case "matchScore":
    case "aiInsight":
      return pack.rules.length > 0;
    case "nearbyPlaces":
      return (item.nearbyAmenities?.length ?? 0) > 0;
    case "locationMap":
      return Boolean(item.location);
    case "availability":
      return item.unitsLeft != null;
    default:
      return true;
  }
}

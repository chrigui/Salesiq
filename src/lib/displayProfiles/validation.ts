import type { InventoryItem } from "@/core/types";
import type { DisplaySection } from "@/lib/serializers/displayProfile";

export interface DisplayProfileAssetLike {
  mimeType: string;
}

export interface DisplayProfileValidationResult {
  /** Publishing must be refused while any of these are non-empty. */
  hardBlocks: string[];
  /** Publishing is still allowed, but the admin should see these before doing it. */
  warnings: string[];
}

/**
 * Pre-publish safety check — never blocks Draft editing, only the moment a
 * profile goes live on a real Customer Display. Hard-blocks are structural
 * (nothing would render at all); warnings flag a widget that's turned on
 * but has no real data behind it yet, so it'll render its honest empty
 * state in front of a customer rather than the content the admin expects.
 */
export function validateDisplayProfileForPublish(
  sections: DisplaySection[],
  item: InventoryItem,
  assets: DisplayProfileAssetLike[],
): DisplayProfileValidationResult {
  const hardBlocks: string[] = [];
  const warnings: string[] = [];

  const enabled = new Set(sections.filter((s) => s.enabled).map((s) => s.type));

  if (enabled.size === 0) {
    hardBlocks.push("No widgets are enabled — the Customer Display would show a blank screen.");
  }

  const hasPhotos = Boolean(item.photo) || (item.gallery?.length ?? 0) > 0;
  const hasDocs = assets.length > 0;
  const hasAppreciation = item.appreciation != null;

  const photoWidgetsEnabled = ["hero", "heroCard", "gallery", "galleryCard"].filter((t) => enabled.has(t));
  if (photoWidgetsEnabled.length > 0 && !hasPhotos) {
    warnings.push("Hero/gallery widgets are enabled but this listing has no photos.");
  }
  if ((enabled.has("investment") || enabled.has("investmentSnapshot")) && !hasAppreciation) {
    warnings.push("Investment is enabled but this listing has no appreciation/rental data tracked.");
  }
  if (enabled.has("masterplan") && !hasDocs) {
    warnings.push("Masterplan is enabled but no documents have been uploaded for this profile.");
  }

  return { hardBlocks, warnings };
}

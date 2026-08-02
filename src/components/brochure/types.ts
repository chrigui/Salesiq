import type { InventoryItem } from "@/core/types";

export interface BrochureBranding {
  name: string;
  tagline: string;
  brand: string;
  brandSoft: string;
  logoGlyph: string;
}

export interface BrochurePackSummary {
  id: string;
  label: string;
  vertical: string;
  currency: string;
  branding: BrochureBranding;
}

export interface BrochureAssetMeta {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export type BrochureTemplate = "Modern" | "Luxury" | "Minimal";

/** Shared context every widget needs — plain, serializable data only. */
export interface BrochureWidgetContext {
  slug: string;
  item: InventoryItem;
  pack: BrochurePackSummary;
  comparables: InventoryItem[];
  assets: BrochureAssetMeta[];
  dark: boolean;
  template: BrochureTemplate;
  locale: "en" | "ar";
  onTrackClick: (via: string) => void;
}

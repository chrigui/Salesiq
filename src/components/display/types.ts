import type { InventoryItem } from "@/core/types";

export interface DisplayBranding {
  name: string;
  tagline: string;
  brand: string;
  brandSoft: string;
  logoGlyph: string;
}

export interface DisplayPackSummary {
  id: string;
  label: string;
  vertical: string;
  currency: string;
  branding: DisplayBranding;
}

export type DisplayTemplate =
  | "Minimal"
  | "NewDevelopment"
  | "Detailed"
  | "Lifestyle"
  | "Investment"
  | "LuxuryCinematic"
  | "Masterplan"
  | "Custom";

/**
 * Shared context every Display Studio widget needs — plain, serializable
 * data only, mirroring src/components/brochure/types.ts's
 * BrochureWidgetContext. The live/preview surface sets --brand/--brand-soft
 * as a scoped inline style on the wrapper (same pattern as BrochureView),
 * so widgets reach for the ordinary text-brand/bg-brand Tailwind classes
 * rather than threading color values through here.
 */
export interface DisplayWidgetContext {
  item: InventoryItem;
  pack: DisplayPackSummary;
  template: DisplayTemplate;
  /** "presentation" = a companion-focused item on the real live Customer Display; "idle" = the same Display's unattended attract state; "preview" = Display Studio's editor preview. Widgets can use this for honest empty-state framing, never to fake data. */
  mode: "presentation" | "idle" | "preview";
}

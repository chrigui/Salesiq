import type { DisplaySection } from "@/lib/serializers/displayProfile";

/** The widget types Display Studio's registry knows how to render, across all six catalog categories: Property (hero/gallery/highlights/specs), Location (neighborhood), Project (masterplan/documents), Investment (investment/comparables), Experience (aiPromptTicker/trustBadges), Conversion (continueQr/leadCapture). */
export const WIDGET_TYPES = [
  "hero",
  "gallery",
  "highlights",
  "specs",
  "neighborhood",
  "masterplan",
  "documents",
  "investment",
  "comparables",
  "aiPromptTicker",
  "trustBadges",
  "continueQr",
  "leadCapture",
] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

export type DisplayTemplateId =
  | "Minimal"
  | "NewDevelopment"
  | "Detailed"
  | "Lifestyle"
  | "Investment"
  | "LuxuryCinematic"
  | "Masterplan"
  | "Custom";

/**
 * Every template seeds all 13 known widget types (the editor's Widgets tab
 * only toggles/reorders what's already in `sections` — there's no per-type
 * "add widget" UI, same as the Brochure module), differing only in which
 * ones start enabled and in what order. Templates are starting points, not
 * locked designs — every widget stays reachable afterward regardless of
 * template.
 */
const TEMPLATE_ORDER: Record<DisplayTemplateId, WidgetType[]> = {
  Minimal: ["hero", "highlights", "specs", "gallery", "neighborhood", "masterplan", "documents", "investment", "comparables", "aiPromptTicker", "trustBadges", "continueQr", "leadCapture"],
  NewDevelopment: ["hero", "gallery", "masterplan", "documents", "highlights", "neighborhood", "leadCapture", "specs", "investment", "comparables", "aiPromptTicker", "trustBadges", "continueQr"],
  Detailed: ["hero", "gallery", "highlights", "specs", "neighborhood", "documents", "trustBadges", "masterplan", "investment", "comparables", "aiPromptTicker", "continueQr", "leadCapture"],
  Lifestyle: ["hero", "gallery", "neighborhood", "highlights", "aiPromptTicker", "continueQr", "specs", "masterplan", "documents", "investment", "comparables", "trustBadges", "leadCapture"],
  Investment: ["hero", "investment", "comparables", "specs", "highlights", "trustBadges", "gallery", "neighborhood", "masterplan", "documents", "aiPromptTicker", "continueQr", "leadCapture"],
  LuxuryCinematic: ["hero", "gallery", "highlights", "trustBadges", "continueQr", "specs", "neighborhood", "masterplan", "documents", "investment", "comparables", "aiPromptTicker", "leadCapture"],
  Masterplan: ["hero", "masterplan", "documents", "neighborhood", "gallery", "highlights", "specs", "investment", "comparables", "aiPromptTicker", "trustBadges", "continueQr", "leadCapture"],
  Custom: ["hero", "gallery", "highlights", "specs", "neighborhood", "masterplan", "documents", "investment", "comparables", "aiPromptTicker", "trustBadges", "continueQr", "leadCapture"],
};

/** How many of each template's ordering starts enabled — the rest are present but off, still one toggle away. */
const TEMPLATE_ENABLED_COUNT: Record<DisplayTemplateId, number> = {
  Minimal: 3,
  NewDevelopment: 7,
  Detailed: 7,
  Lifestyle: 6,
  Investment: 6,
  LuxuryCinematic: 5,
  Masterplan: 5,
  Custom: 1,
};

/** Sensible default composition for a newly created profile, varying by template — editable afterward in the editor (toggle/reorder-only convention, same as the Brochure module). */
export function defaultDisplaySections(template: DisplayTemplateId = "Minimal"): DisplaySection[] {
  const order = TEMPLATE_ORDER[template] ?? TEMPLATE_ORDER.Minimal;
  const enabledCount = TEMPLATE_ENABLED_COUNT[template] ?? 3;
  return order.map((type, i) => ({
    id: type,
    type,
    enabled: i < enabledCount,
    order: i,
  }));
}

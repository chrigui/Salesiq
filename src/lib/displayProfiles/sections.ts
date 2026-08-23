import type { DisplaySection } from "@/lib/serializers/displayProfile";

/** The widget types Display Studio's registry knows how to render, across all six catalog categories: Property (hero/gallery/highlights/specs), Location (neighborhood), Project (masterplan/documents), Investment (investment/comparables), Experience (aiPromptTicker/trustBadges), Conversion (continueQr/leadCapture). Dashboard-grid-native widgets (compact card variants) are listed separately below. */
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
  // Grid-layout widgets — small card variants designed for the Dashboard
  // template's `layout: "Grid"` (see DisplayProfileRenderer.tsx). Usable in
  // a Stack profile too (they just render as a normal-width card there).
  "heroCard",
  "matchScore",
  "nearbyPlaces",
  "investmentSnapshot",
  "galleryCard",
  "locationMap",
  "priceSummary",
  "availability",
  "comparisonMini",
  "comparisonTable",
  "documentsCard",
  "saveShare",
  "leadCaptureCard",
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
  | "Custom"
  | "Dashboard";

/** Default grid span for a widget when no per-section override is set — small/native grid widgets default to a compact size, every full-width legacy widget defaults to spanning the whole row. */
const DEFAULT_SPAN: Partial<Record<WidgetType, "sm" | "md" | "lg">> = {
  heroCard: "lg",
  matchScore: "sm",
  nearbyPlaces: "md",
  investmentSnapshot: "md",
  galleryCard: "md",
  locationMap: "md",
  priceSummary: "sm",
  availability: "sm",
  comparisonMini: "sm",
  comparisonTable: "md",
  documentsCard: "md",
  saveShare: "sm",
  leadCaptureCard: "md",
};

/**
 * Every template seeds all 13 known widget types (the editor's Widgets tab
 * only toggles/reorders what's already in `sections` — there's no per-type
 * "add widget" UI, same as the Brochure module), differing only in which
 * ones start enabled and in what order. Templates are starting points, not
 * locked designs — every widget stays reachable afterward regardless of
 * template.
 */
// Every non-Dashboard template's Tier 2 tail is the same order: these are
// new, off-by-default additions to an existing template, not a curated
// per-template composition — a genuinely tailored order can follow if a
// template's authors want one.
const TIER2_TAIL: WidgetType[] = [
  "priceSummary",
  "availability",
  "comparisonMini",
  "comparisonTable",
  "documentsCard",
  "saveShare",
  "leadCaptureCard",
];

const TEMPLATE_ORDER: Record<DisplayTemplateId, WidgetType[]> = {
  Minimal: ["hero", "highlights", "specs", "gallery", "neighborhood", "masterplan", "documents", "investment", "comparables", "aiPromptTicker", "trustBadges", "continueQr", "leadCapture", ...TIER2_TAIL],
  NewDevelopment: ["hero", "gallery", "masterplan", "documents", "highlights", "neighborhood", "leadCapture", "specs", "investment", "comparables", "aiPromptTicker", "trustBadges", "continueQr", ...TIER2_TAIL],
  Detailed: ["hero", "gallery", "highlights", "specs", "neighborhood", "documents", "trustBadges", "masterplan", "investment", "comparables", "aiPromptTicker", "continueQr", "leadCapture", ...TIER2_TAIL],
  Lifestyle: ["hero", "gallery", "neighborhood", "highlights", "aiPromptTicker", "continueQr", "specs", "masterplan", "documents", "investment", "comparables", "trustBadges", "leadCapture", ...TIER2_TAIL],
  Investment: ["hero", "investment", "comparables", "specs", "highlights", "trustBadges", "gallery", "neighborhood", "masterplan", "documents", "aiPromptTicker", "continueQr", "leadCapture", ...TIER2_TAIL],
  LuxuryCinematic: ["hero", "gallery", "highlights", "trustBadges", "continueQr", "specs", "neighborhood", "masterplan", "documents", "investment", "comparables", "aiPromptTicker", "leadCapture", ...TIER2_TAIL],
  Masterplan: ["hero", "masterplan", "documents", "neighborhood", "gallery", "highlights", "specs", "investment", "comparables", "aiPromptTicker", "trustBadges", "continueQr", "leadCapture", ...TIER2_TAIL],
  Custom: ["hero", "gallery", "highlights", "specs", "neighborhood", "masterplan", "documents", "investment", "comparables", "aiPromptTicker", "trustBadges", "continueQr", "leadCapture", ...TIER2_TAIL],
  Dashboard: [
    "heroCard",
    "matchScore",
    "nearbyPlaces",
    "investmentSnapshot",
    "galleryCard",
    "locationMap",
    "priceSummary",
    "availability",
    "comparisonMini",
    "comparisonTable",
    "documentsCard",
    "saveShare",
    "leadCaptureCard",
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
  ],
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
  Dashboard: 6,
};

/** Sensible default composition for a newly created profile, varying by template — editable afterward in the editor (toggle/reorder-only convention, same as the Brochure module). */
export function defaultDisplaySections(template: DisplayTemplateId = "Minimal"): DisplaySection[] {
  const order = TEMPLATE_ORDER[template] ?? TEMPLATE_ORDER.Minimal;
  const enabledCount = TEMPLATE_ENABLED_COUNT[template] ?? 3;
  return order.map((type, i) => {
    const span = DEFAULT_SPAN[type];
    return {
      id: type,
      type,
      enabled: i < enabledCount,
      order: i,
      ...(span ? { config: { span } } : {}),
    };
  });
}

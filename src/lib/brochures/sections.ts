import type { BrochureSection } from "@/lib/serializers/brochure";

/** The widget types the public microsite's registry knows how to render. */
export const WIDGET_TYPES = [
  "hero",
  "gallery",
  "highlights",
  "specs",
  "map",
  "investment",
  "documents",
  "leadForm",
] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

/** Sensible default composition for a newly generated brochure — every widget on, in a natural reading order. Editable afterward in the Brochure Editor. */
export function defaultSections(): BrochureSection[] {
  return WIDGET_TYPES.map((type, i) => ({
    id: type,
    type,
    enabled: true,
    order: i,
  }));
}

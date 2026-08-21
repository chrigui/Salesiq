import type { DisplaySection } from "@/lib/serializers/displayProfile";

/** The widget types Display Studio's registry knows how to render — grows across PRs (Property/Location/Project/Investment/Experience/Conversion). PR1 shipped the four Property widgets; PR3 adds Location (neighborhood) and Project (masterplan, documents). */
export const WIDGET_TYPES = [
  "hero",
  "gallery",
  "highlights",
  "specs",
  "neighborhood",
  "masterplan",
  "documents",
] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

/** Sensible default composition for a newly created profile — every widget on, in a natural reading order. Editable afterward in the editor (same toggle/reorder-only convention as the Brochure module — no per-type "add widget" UI exists yet). Every DisplayTemplate seeds this same set until PR6 gives each template its own starting mix. */
export function defaultDisplaySections(): DisplaySection[] {
  return WIDGET_TYPES.map((type, i) => ({
    id: type,
    type,
    enabled: true,
    order: i,
  }));
}

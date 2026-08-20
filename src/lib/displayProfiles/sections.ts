import type { DisplaySection } from "@/lib/serializers/displayProfile";

/** The widget types Display Studio's registry knows how to render — grows across PRs (Property/Location/Project/Investment/Experience/Conversion). PR1 ships the four Property widgets. */
export const WIDGET_TYPES = ["hero", "gallery", "highlights", "specs"] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

/** Sensible default composition for a newly created profile — every widget on, in a natural reading order. Editable afterward in the editor. Every DisplayTemplate seeds this same set in PR1; later PRs give each template its own starting mix. */
export function defaultDisplaySections(): DisplaySection[] {
  return WIDGET_TYPES.map((type, i) => ({
    id: type,
    type,
    enabled: true,
    order: i,
  }));
}

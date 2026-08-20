import type { ComponentType } from "react";
import { DisplayHero } from "./widgets/DisplayHero";
import { DisplayGallery } from "./widgets/DisplayGallery";
import { DisplayHighlights } from "./widgets/DisplayHighlights";
import { DisplaySpecs } from "./widgets/DisplaySpecs";
import type { DisplayWidgetContext } from "./types";

/** Display Studio's widget registry — the "no hardcoded templates" part: a profile is just an ordered list of these, toggled/reordered in the editor, rendered identically in the editor preview and on the real Customer Display. Grows across later PRs to cover Location/Project/Investment/Experience/Conversion. */
export const WIDGET_REGISTRY: Record<string, ComponentType<DisplayWidgetContext>> = {
  hero: DisplayHero,
  gallery: DisplayGallery,
  highlights: DisplayHighlights,
  specs: DisplaySpecs,
};

export const WIDGET_LABELS: Record<string, string> = {
  hero: "Hero",
  gallery: "Gallery",
  highlights: "Highlights",
  specs: "Specs",
};

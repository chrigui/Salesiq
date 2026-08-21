import type { ComponentType } from "react";
import { DisplayHero } from "./widgets/DisplayHero";
import { DisplayGallery } from "./widgets/DisplayGallery";
import { DisplayHighlights } from "./widgets/DisplayHighlights";
import { DisplaySpecs } from "./widgets/DisplaySpecs";
import { DisplayNeighborhood } from "./widgets/DisplayNeighborhood";
import { DisplayMasterplan } from "./widgets/DisplayMasterplan";
import { DisplayDocuments } from "./widgets/DisplayDocuments";
import type { DisplayWidgetContext } from "./types";

/** Display Studio's widget registry — the "no hardcoded templates" part: a profile is just an ordered list of these, toggled/reordered in the editor, rendered identically in the editor preview and on the real Customer Display. Grows across later PRs to cover Investment/Experience/Conversion. */
export const WIDGET_REGISTRY: Record<string, ComponentType<DisplayWidgetContext>> = {
  hero: DisplayHero,
  gallery: DisplayGallery,
  highlights: DisplayHighlights,
  specs: DisplaySpecs,
  neighborhood: DisplayNeighborhood,
  masterplan: DisplayMasterplan,
  documents: DisplayDocuments,
};

export const WIDGET_LABELS: Record<string, string> = {
  hero: "Hero",
  gallery: "Gallery",
  highlights: "Highlights",
  specs: "Specs",
  neighborhood: "Neighborhood",
  masterplan: "Masterplan",
  documents: "Documents",
};

import type { ComponentType } from "react";
import { Hero } from "./widgets/Hero";
import { Gallery } from "./widgets/Gallery";
import { Highlights } from "./widgets/Highlights";
import { Specs } from "./widgets/Specs";
import { BrochureMap } from "./widgets/BrochureMap";
import { Investment } from "./widgets/Investment";
import { Documents } from "./widgets/Documents";
import { LeadForm } from "./widgets/LeadForm";
import type { BrochureWidgetContext } from "./types";

/** The public microsite's widget registry — the "no hardcoded templates" part: a brochure is just an ordered list of these, toggled/reordered in the Brochure Editor. */
export const WIDGET_REGISTRY: Record<string, ComponentType<BrochureWidgetContext>> = {
  hero: Hero,
  gallery: Gallery,
  highlights: Highlights,
  specs: Specs,
  map: BrochureMap,
  investment: Investment,
  documents: Documents,
  leadForm: LeadForm,
};

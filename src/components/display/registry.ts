import type { ComponentType } from "react";
import { DisplayHero } from "./widgets/DisplayHero";
import { DisplayGallery } from "./widgets/DisplayGallery";
import { DisplayHighlights } from "./widgets/DisplayHighlights";
import { DisplaySpecs } from "./widgets/DisplaySpecs";
import { DisplayNeighborhood } from "./widgets/DisplayNeighborhood";
import { DisplayMasterplan } from "./widgets/DisplayMasterplan";
import { DisplayDocuments } from "./widgets/DisplayDocuments";
import { DisplayInvestment } from "./widgets/DisplayInvestment";
import { DisplayComparables } from "./widgets/DisplayComparables";
import { DisplayAiPromptTicker } from "./widgets/DisplayAiPromptTicker";
import { DisplayTrustBadges } from "./widgets/DisplayTrustBadges";
import { DisplayContinueQr } from "./widgets/DisplayContinueQr";
import { DisplayLeadCapture } from "./widgets/DisplayLeadCapture";
import { DisplayHeroCard } from "./widgets/DisplayHeroCard";
import { DisplayMatchScore } from "./widgets/DisplayMatchScore";
import { DisplayNearbyPlaces } from "./widgets/DisplayNearbyPlaces";
import { DisplayInvestmentSnapshot } from "./widgets/DisplayInvestmentSnapshot";
import { DisplayGalleryCard } from "./widgets/DisplayGalleryCard";
import { DisplayLocationMap } from "./widgets/DisplayLocationMap";
import { DisplayPriceSummary } from "./widgets/DisplayPriceSummary";
import { DisplayAvailability } from "./widgets/DisplayAvailability";
import { DisplayComparisonMini } from "./widgets/DisplayComparisonMini";
import { DisplayComparisonTable } from "./widgets/DisplayComparisonTable";
import { DisplayDocumentsCard } from "./widgets/DisplayDocumentsCard";
import { DisplaySaveShare } from "./widgets/DisplaySaveShare";
import { DisplayLeadCaptureCard } from "./widgets/DisplayLeadCaptureCard";
import { DisplayProgressSteps } from "./widgets/DisplayProgressSteps";
import { DisplayAiInsight } from "./widgets/DisplayAiInsight";
import type { DisplayWidgetContext } from "./types";

/** Display Studio's widget registry — the "no hardcoded templates" part: a profile is just an ordered list of these, toggled/reordered in the editor, rendered identically in the editor preview and on the real Customer Display. Covers all six catalog categories: Property, Location, Project, Investment, Experience, Conversion. */
export const WIDGET_REGISTRY: Record<string, ComponentType<DisplayWidgetContext>> = {
  hero: DisplayHero,
  gallery: DisplayGallery,
  highlights: DisplayHighlights,
  specs: DisplaySpecs,
  neighborhood: DisplayNeighborhood,
  masterplan: DisplayMasterplan,
  documents: DisplayDocuments,
  investment: DisplayInvestment,
  comparables: DisplayComparables,
  aiPromptTicker: DisplayAiPromptTicker,
  trustBadges: DisplayTrustBadges,
  continueQr: DisplayContinueQr,
  leadCapture: DisplayLeadCapture,
  heroCard: DisplayHeroCard,
  matchScore: DisplayMatchScore,
  nearbyPlaces: DisplayNearbyPlaces,
  investmentSnapshot: DisplayInvestmentSnapshot,
  galleryCard: DisplayGalleryCard,
  locationMap: DisplayLocationMap,
  priceSummary: DisplayPriceSummary,
  availability: DisplayAvailability,
  comparisonMini: DisplayComparisonMini,
  comparisonTable: DisplayComparisonTable,
  documentsCard: DisplayDocumentsCard,
  saveShare: DisplaySaveShare,
  leadCaptureCard: DisplayLeadCaptureCard,
  progressSteps: DisplayProgressSteps,
  aiInsight: DisplayAiInsight,
};

export const WIDGET_LABELS: Record<string, string> = {
  hero: "Hero",
  gallery: "Gallery",
  highlights: "Highlights",
  specs: "Specs",
  neighborhood: "Neighborhood",
  masterplan: "Masterplan",
  documents: "Documents",
  investment: "Investment",
  comparables: "Comparable listings",
  aiPromptTicker: "AI prompt ticker",
  trustBadges: "Trust badges",
  continueQr: "Continue on phone (QR)",
  leadCapture: "Lead capture form",
  heroCard: "Property hero (card)",
  matchScore: "Why we recommend this (match score)",
  nearbyPlaces: "Nearby places",
  investmentSnapshot: "Investment snapshot (card)",
  galleryCard: "Gallery (card)",
  locationMap: "Location map",
  priceSummary: "Price summary",
  availability: "Availability",
  comparisonMini: "Also consider (mini)",
  comparisonTable: "Comparison table",
  documentsCard: "Documents (card)",
  saveShare: "Save & share",
  leadCaptureCard: "Lead capture (card)",
  progressSteps: "Progress steps",
  aiInsight: "AI insight",
};

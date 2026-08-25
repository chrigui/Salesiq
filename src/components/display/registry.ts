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

/** One-line blurb per widget for the Widget Library's browsable cards — what a client sees before adding it, not a full spec. */
export const WIDGET_DESCRIPTIONS: Record<string, string> = {
  hero: "Full-bleed hero image with headline and call to action",
  gallery: "Swipeable full-screen photo gallery",
  highlights: "Key selling points as a quick-scan list",
  specs: "Bedrooms, bathrooms, size, and other specs",
  neighborhood: "What's nearby — schools, transit, amenities",
  masterplan: "Development masterplan and construction phases",
  documents: "Brochures, floor plans, and legal documents",
  investment: "Rental yield, appreciation, and ROI projections",
  comparables: "Similar listings shown for side-by-side context",
  aiPromptTicker: "Rotating AI-suggested questions to ask",
  trustBadges: "Certifications, awards, and credibility markers",
  continueQr: "QR code to continue the session on a phone",
  leadCapture: "Full-size form to capture contact details",
  heroCard: "Compact hero image tile for grid layouts",
  matchScore: "Why this property fits — match score and reasons",
  nearbyPlaces: "Nearby amenities as a compact card",
  investmentSnapshot: "At-a-glance ROI and rental yield card",
  galleryCard: "Compact photo gallery tile for grid layouts",
  locationMap: "Embedded map centered on the property",
  priceSummary: "Price, price per sqft, and payment plan snapshot",
  availability: "Unit availability status — Available, Reserved, Sold",
  comparisonMini: "Quick side-by-side against one or two alternatives",
  comparisonTable: "Full comparison table across saved listings",
  documentsCard: "Compact document download tile",
  saveShare: "Save to shortlist or share this listing",
  leadCaptureCard: "Compact contact-capture tile for grid layouts",
  progressSteps: "Where the customer is in their journey",
  aiInsight: "A live AI-generated insight about this match",
};

/** The Widget Library's six catalog categories — grouping only, same widgets/registry underneath. */
export const WIDGET_CATEGORIES = ["Property", "Location", "Project", "Investment", "Experience", "Conversion"] as const;
export type WidgetCategory = (typeof WIDGET_CATEGORIES)[number];

export const WIDGET_CATEGORY: Record<string, WidgetCategory> = {
  hero: "Property",
  gallery: "Property",
  highlights: "Property",
  specs: "Property",
  heroCard: "Property",
  galleryCard: "Property",
  priceSummary: "Property",
  availability: "Property",
  neighborhood: "Location",
  nearbyPlaces: "Location",
  locationMap: "Location",
  masterplan: "Project",
  documents: "Project",
  documentsCard: "Project",
  investment: "Investment",
  comparables: "Investment",
  investmentSnapshot: "Investment",
  comparisonMini: "Investment",
  comparisonTable: "Investment",
  aiPromptTicker: "Experience",
  trustBadges: "Experience",
  matchScore: "Experience",
  progressSteps: "Experience",
  aiInsight: "Experience",
  continueQr: "Conversion",
  leadCapture: "Conversion",
  saveShare: "Conversion",
  leadCaptureCard: "Conversion",
};

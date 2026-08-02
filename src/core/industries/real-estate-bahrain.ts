import type { IndustryPack } from "@/core/types";
import { compileRules } from "./rules";
import { bahrainListings } from "./data/real-estate-bahrain-listings";

/**
 * A second real-estate brand, distinct from Green Hills Living (Cyprus) —
 * built for a Bahrain-market demo. Inventory is 500 synthetic listings (see
 * data/real-estate-bahrain-listings.ts for exactly what's real vs.
 * generated); the question set and scoring rules below only reference
 * attributes that dataset actually has (budget, bedrooms, bathrooms, floor
 * area, property type) — no invented amenities, schools, or investment
 * data the way Green Hills Living's showcase inventory has, since there's
 * no real per-listing detail here to back that.
 */
export const bahrainRealEstatePack: IndustryPack = {
  id: "real-estate-bahrain",
  label: "Real Estate — Bahrain",
  vertical: "residential real estate — Bahrain",
  currency: "BHD",
  branding: {
    name: "Pearl Coast Properties",
    tagline: "Find your place in the Kingdom.",
    brand: "20 184 166", // teal
    brandSoft: "45 212 191",
    logoGlyph: "◆",
  },
  sections: [
    { id: "household", label: "Household" },
    { id: "budget", label: "Budget" },
    { id: "home", label: "The Home" },
  ],
  questions: [
    {
      id: "household",
      label: "Household",
      prompt: "Who is this home for?",
      type: "single",
      section: "household",
      options: [
        { id: "single", label: "Single", icon: "User" },
        { id: "couple", label: "Couple", icon: "Users" },
        { id: "family", label: "Family", icon: "Home" },
      ],
    },
    {
      id: "budget",
      label: "Budget",
      prompt: "What budget are we working with?",
      type: "budget",
      section: "budget",
      min: 40000,
      max: 460000,
      step: 5000,
      unit: "BHD",
      weight: 3,
    },
    {
      id: "bedrooms",
      label: "Bedrooms",
      prompt: "How many bedrooms do you need?",
      type: "counter",
      section: "home",
      min: 0,
      max: 6,
    },
    {
      id: "bathrooms",
      label: "Bathrooms",
      prompt: "How many bathrooms do you need?",
      type: "counter",
      section: "home",
      min: 1,
      max: 7,
    },
    {
      id: "propertyType",
      label: "Property type",
      prompt: "What kind of home are you looking for?",
      type: "single",
      section: "home",
      options: [
        { id: "apartment", label: "Apartment", icon: "Building2" },
        { id: "studio", label: "Studio", icon: "DoorOpen" },
        { id: "townhouse", label: "Townhouse", icon: "Home" },
        { id: "villa", label: "Villa", icon: "Castle" },
      ],
    },
    {
      id: "minArea",
      label: "Minimum size",
      prompt: "What's the minimum floor area you need?",
      type: "slider",
      section: "home",
      min: 35,
      max: 550,
      step: 5,
      unit: "m²",
    },
  ],
  inventory: bahrainListings,
  ruleSpecs: [
    { id: "budget-fit", kind: "budget", questionId: "budget", weight: 3 },
    {
      id: "bedrooms-min",
      kind: "atLeast",
      questionId: "bedrooms",
      attribute: "bedrooms",
      weight: 2.5,
      reason: "it offers {have} bedrooms, meeting your need for {need}",
    },
    {
      id: "bathrooms-min",
      kind: "atLeast",
      questionId: "bathrooms",
      attribute: "bathrooms",
      weight: 1.5,
      reason: "it has {have} bathrooms",
    },
    {
      id: "area-min",
      kind: "atLeast",
      questionId: "minArea",
      attribute: "areaSqm",
      weight: 2,
      reason: "it offers {have} m², meeting your minimum of {need} m²",
    },
    {
      id: "type-apartment",
      kind: "feature",
      questionId: "propertyType",
      attribute: "apartment",
      weight: 2,
      reason: "it's the apartment you're looking for",
    },
    {
      id: "type-studio",
      kind: "feature",
      questionId: "propertyType",
      attribute: "studio",
      weight: 2,
      reason: "it's the studio you're looking for",
    },
    {
      id: "type-townhouse",
      kind: "feature",
      questionId: "propertyType",
      attribute: "townhouse",
      weight: 2,
      reason: "it's the townhouse you're looking for",
    },
    {
      id: "type-villa",
      kind: "feature",
      questionId: "propertyType",
      attribute: "villa",
      weight: 2,
      reason: "it's the villa you're looking for",
    },
  ],
  rules: [],
};

bahrainRealEstatePack.rules = compileRules(bahrainRealEstatePack.ruleSpecs!);

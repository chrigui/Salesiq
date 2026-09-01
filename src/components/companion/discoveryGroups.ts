/**
 * Per-pack Discovery Wizard grouping — presentation-only, layered on top of
 * `pack.questions`/`pack.sections` without changing what those mean
 * elsewhere (the existing section tabs in the Companion workspace, the
 * admin Question Builder). A pack with no entry here has no wizard yet —
 * DiscoveryWizard falls straight through to the workspace rather than
 * showing a broken/empty step list, so this never blocks a pack this round
 * doesn't cover (Bahrain, Automotive, Private Jets, custom packs).
 */
export interface DiscoveryGroup {
  title: string;
  questionIds: string[];
}

export const DISCOVERY_GROUPS: Record<string, DiscoveryGroup[]> = {
  "real-estate": [
    { title: "About them", questionIds: ["household", "familySize", "intent"] },
    { title: "Location & commute", questionIds: ["destinationType", "workLocation", "commuteImportance", "maxCommute"] },
    { title: "Location preferences", questionIds: ["nearbyPreferences", "locationImportance"] },
    { title: "Property type", questionIds: ["propertyType", "bedrooms"] },
    { title: "Lifestyle", questionIds: ["lifestyleStyle"] },
    { title: "Home features", questionIds: ["homeFeatures"] },
    { title: "Financial profile", questionIds: ["budget", "purchaseMethod", "monthlyPayment"] },
    { title: "Timing", questionIds: ["timing"] },
  ],
  // Identical grouping to "real-estate" — melia-beachfront.ts deliberately
  // reuses every question id so the guided wizard needs no new logic, only
  // this lookup entry (see the file header comment for why).
  "melia-beachfront": [
    { title: "About them", questionIds: ["household", "familySize", "intent"] },
    { title: "Location & commute", questionIds: ["destinationType", "workLocation", "commuteImportance", "maxCommute"] },
    { title: "Location preferences", questionIds: ["nearbyPreferences", "locationImportance"] },
    { title: "Unit type", questionIds: ["propertyType", "bedrooms"] },
    { title: "Lifestyle", questionIds: ["lifestyleStyle"] },
    { title: "Unit features", questionIds: ["homeFeatures"] },
    { title: "Financial profile", questionIds: ["budget", "purchaseMethod", "monthlyPayment"] },
    { title: "Timing", questionIds: ["timing"] },
  ],
};

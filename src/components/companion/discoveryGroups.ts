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
    { title: "About them", questionIds: ["household", "familySize"] },
    { title: "Where they need to be", questionIds: ["workLocation", "quiet", "schools", "seaView"] },
    { title: "The home", questionIds: ["bedrooms", "garden"] },
    { title: "Budget", questionIds: ["budget"] },
    { title: "Why they're buying", questionIds: ["intent"] },
  ],
};

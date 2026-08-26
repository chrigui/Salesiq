/** Frozen-at-creation shapes stored in Recap.shortlistedProperties/comparedProperties/requirementsSnapshot. */

export interface RecapShortlistedProperty {
  itemId: string;
  order: number;
  score: number;
  reasons: string[];
  priceAtCreation: number;
  currency: string;
  availabilityAtCreation: string | null;
}

export interface RecapComparedProperties {
  itemIds: string[];
  /** Human-readable difference lines, e.g. "Marina Vista: doesn't have a garden" — authored text, frozen. */
  differences: string[];
}

export interface RecapSnapshot {
  customerNameSnapshot: string | null;
  requirementsSnapshot: Record<string, unknown>;
  shortlistedProperties: RecapShortlistedProperty[];
  comparedProperties: RecapComparedProperties | null;
  finalRecommendationItemId: string | null;
}

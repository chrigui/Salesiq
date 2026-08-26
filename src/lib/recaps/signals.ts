export interface RecapEventCounts {
  View: number;
  PropertyView: number;
  GalleryView: number;
  FloorPlanView: number;
  PaymentView: number;
  InvestmentView: number;
  ComparisonView: number;
  Favorite: number;
  Unfavorite: number;
  ContactClick: number;
  ShareClick: number;
  QrScan: number;
  LinkOpen: number;
}

export function emptyRecapEventCounts(): RecapEventCounts {
  return {
    View: 0,
    PropertyView: 0,
    GalleryView: 0,
    FloorPlanView: 0,
    PaymentView: 0,
    InvestmentView: 0,
    ComparisonView: 0,
    Favorite: 0,
    Unfavorite: 0,
    ContactClick: 0,
    ShareClick: 0,
    QrScan: 0,
    LinkOpen: 0,
  };
}

export type RecapEngagementLevel = "No activity yet" | "Light engagement" | "Moderate engagement" | "Strong engagement";

export interface RecapSignal {
  text: string;
  /** OBSERVED = a direct tally of something that really happened. INFERRED = a soft read on the pattern of activity — never phrased as purchase intent (that's Buyer Intelligence's separate, explicit classifier). */
  kind: "observed" | "inferred";
}

export interface RecapEngagementSummary {
  level: RecapEngagementLevel;
  score: number;
  signals: RecapSignal[];
}

/**
 * How much each event kind contributes to the overall engagement score —
 * weighted toward actions that take real effort (viewing payment/investment
 * detail, favoriting, tapping contact) over the passive baseline of opening
 * the link. Calibrated so the spec's own worked example — "8 views + 2
 * floor-plan + 3 payment" (8*1 + 2*2 + 3*3 = 21) — lands in "Strong
 * engagement".
 */
const WEIGHTS: Partial<Record<keyof RecapEventCounts, number>> = {
  View: 1,
  PropertyView: 1,
  GalleryView: 1,
  FloorPlanView: 2,
  PaymentView: 3,
  InvestmentView: 2,
  ComparisonView: 1,
  Favorite: 3,
  ContactClick: 5,
  ShareClick: 2,
};

function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm;
}

/**
 * Derives a salesperson-facing engagement summary from real RecapEvent
 * tallies — no invented data, no phrasing that implies purchase intent
 * (that classification lives only in Buyer Intelligence's explicit
 * intent.ts/purchaseReadiness.ts, backed by its own signal set). Every
 * OBSERVED signal is a literal count; every INFERRED signal is a named,
 * conservative read on the shape of the activity, not a probability.
 */
export function deriveRecapEngagement(counts: RecapEventCounts): RecapEngagementSummary {
  let score = 0;
  for (const key of Object.keys(WEIGHTS) as (keyof RecapEventCounts)[]) {
    score += counts[key] * (WEIGHTS[key] ?? 0);
  }

  const signals: RecapSignal[] = [];

  if (counts.View > 0) {
    signals.push({ text: `Opened the recap ${counts.View} ${plural(counts.View, "time", "times")}`, kind: "observed" });
  }
  if (counts.PropertyView > 0) {
    signals.push({
      text: `Explored ${counts.PropertyView} ${plural(counts.PropertyView, "property", "properties")} in detail`,
      kind: "observed",
    });
  }
  if (counts.FloorPlanView > 0) {
    signals.push({ text: `Viewed the floor plan ${counts.FloorPlanView} ${plural(counts.FloorPlanView, "time", "times")}`, kind: "observed" });
  }
  if (counts.PaymentView > 0) {
    signals.push({ text: `Viewed the payment plan ${counts.PaymentView} ${plural(counts.PaymentView, "time", "times")}`, kind: "observed" });
  }
  if (counts.InvestmentView > 0) {
    signals.push({
      text: `Viewed investment details ${counts.InvestmentView} ${plural(counts.InvestmentView, "time", "times")}`,
      kind: "observed",
    });
  }
  if (counts.ComparisonView > 0) {
    signals.push({
      text: `Reviewed the comparison ${counts.ComparisonView} ${plural(counts.ComparisonView, "time", "times")}`,
      kind: "observed",
    });
  }
  if (counts.Favorite > 0) {
    signals.push({ text: `Favorited ${counts.Favorite} ${plural(counts.Favorite, "property", "properties")}`, kind: "observed" });
  }
  if (counts.ContactClick > 0) {
    signals.push({ text: `Tapped to contact you ${counts.ContactClick} ${plural(counts.ContactClick, "time", "times")}`, kind: "observed" });
  }
  if (counts.ShareClick > 0) {
    signals.push({ text: `Shared the recap ${counts.ShareClick} ${plural(counts.ShareClick, "time", "times")}`, kind: "observed" });
  }

  if (counts.PaymentView > 0 || counts.InvestmentView > 0) {
    signals.push({ text: "Actively exploring financing details", kind: "inferred" });
  }
  if (counts.View > 1) {
    signals.push({ text: "Returned to the recap more than once", kind: "inferred" });
  }
  if (counts.ComparisonView > 0 && counts.PropertyView > 1) {
    signals.push({ text: "Weighing multiple properties against each other", kind: "inferred" });
  }

  let level: RecapEngagementLevel;
  if (score === 0) level = "No activity yet";
  else if (score < 6) level = "Light engagement";
  else if (score < 15) level = "Moderate engagement";
  else level = "Strong engagement";

  return { level, score, signals };
}

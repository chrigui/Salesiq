/**
 * Purchase readiness (spec §6) — the buyer's position in a fixed 8-stage
 * journey, always with a confidence percentage and the real signals behind
 * it. Wave 1 keeps the 8 stage labels fixed (developer-configurable stages
 * are a Wave 2 refinement); the classifier itself only ever reads the same
 * persisted evidence intent.ts does, plus BuyerItemRelationship states that
 * don't exist yet for any automatic Wave 1 write path (negotiating/reserved/
 * purchased) but are honoured here so a manually-recorded one is reflected
 * honestly rather than ignored.
 */
export const PURCHASE_READINESS_STAGES = [
  "Exploring",
  "Researching",
  "Shortlisting",
  "Evaluating",
  "Negotiating",
  "Decision Ready",
  "Reservation Ready",
  "Purchased",
] as const;

export type PurchaseReadinessStage = (typeof PURCHASE_READINESS_STAGES)[number];

export interface PurchaseReadinessResult {
  stage: PurchaseReadinessStage;
  confidence: number; // 0-100
  signals: string[];
}

export interface PurchaseReadinessInput {
  activityEvents: { kind: string; createdAt: number }[];
  relationships: { state: string; itemId: string; createdAt: number }[];
  objections: { resolvedAt: number | null }[];
}

export function classifyPurchaseReadiness(input: PurchaseReadinessInput): PurchaseReadinessResult {
  const { activityEvents, relationships, objections } = input;
  const states = new Set(relationships.map((r) => r.state));
  const signals: string[] = [];
  let evidenceCount = 0;

  const viewedCount = activityEvents.filter((e) => e.kind === "property_viewed").length;
  const savedCount = relationships.filter((r) => r.state === "saved").length;
  const proposalCount = activityEvents.filter((e) => e.kind === "proposal_generated").length;
  const unresolvedObjections = objections.filter((o) => !o.resolvedAt).length;

  let stage: PurchaseReadinessStage;
  if (states.has("purchased")) {
    stage = "Purchased";
    signals.push("Marked purchased");
    evidenceCount += 5;
  } else if (states.has("reserved")) {
    stage = "Reservation Ready";
    signals.push("A reservation step has been recorded");
    evidenceCount += 4;
  } else if (states.has("negotiating")) {
    stage = "Negotiating";
    signals.push("Negotiation has been recorded");
    evidenceCount += 4;
  } else if (proposalCount > 0 && unresolvedObjections === 0 && savedCount > 0) {
    stage = "Decision Ready";
    signals.push(`${proposalCount} proposal${proposalCount === 1 ? "" : "s"} generated with no unresolved objections`);
    evidenceCount += 3;
  } else if (proposalCount > 0 || (savedCount >= 2 && viewedCount >= 3)) {
    stage = "Evaluating";
    if (proposalCount > 0) signals.push(`${proposalCount} proposal${proposalCount === 1 ? "" : "s"} generated`);
    if (savedCount >= 2) signals.push(`${savedCount} items saved for comparison`);
    evidenceCount += 3;
  } else if (savedCount >= 1) {
    stage = "Shortlisting";
    signals.push(`${savedCount} item${savedCount === 1 ? "" : "s"} saved`);
    evidenceCount += 2;
  } else if (viewedCount >= 1) {
    stage = "Researching";
    signals.push(`${viewedCount} propert${viewedCount === 1 ? "y" : "ies"} viewed`);
    evidenceCount += 1;
  } else {
    stage = "Exploring";
  }

  if (unresolvedObjections > 0) {
    signals.push(`${unresolvedObjections} unresolved objection${unresolvedObjections === 1 ? "" : "s"}`);
  }

  const confidence = Math.max(0, Math.min(100, evidenceCount * 20));
  return { stage, confidence, signals };
}

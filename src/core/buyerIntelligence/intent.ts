/**
 * Buyer intent (spec §5) — a deterministic, evidence-based read of how
 * seriously this buyer is engaging, built from their PERSISTED cross-session
 * record (BuyerActivityEvent / BuyerItemRelationship / BuyerObjection), not
 * the live session's ephemeral signals (those stay in core/engine/copilot.ts
 * and core/engine/salesTwin.ts, rendered separately as "this session").
 * Always returns a level plus the real reasons behind it — never a bare
 * number, and never invented when there's simply no evidence yet.
 */
export type IntentLevel = "low" | "medium" | "high" | "very_high";

export interface IntentResult {
  level: IntentLevel;
  reasons: string[];
}

export interface IntentInput {
  activityEvents: { kind: string; itemId: string | null; createdAt: number }[];
  relationships: { state: string; itemId: string; createdAt: number }[];
  objections: { kind: string; resolvedAt: number | null }[];
}

export function classifyIntent(input: IntentInput): IntentResult {
  const { activityEvents, relationships, objections } = input;
  let score = 0;
  const reasons: string[] = [];

  const viewed = activityEvents.filter((e) => e.kind === "property_viewed");
  if (viewed.length > 0) {
    score += Math.min(viewed.length, 4);
    reasons.push(`${viewed.length} propert${viewed.length === 1 ? "y" : "ies"} viewed`);
  }

  const viewedItemCounts = new Map<string, number>();
  for (const e of viewed) {
    if (!e.itemId) continue;
    viewedItemCounts.set(e.itemId, (viewedItemCounts.get(e.itemId) ?? 0) + 1);
  }
  const repeatViews = [...viewedItemCounts.values()].filter((n) => n >= 2).length;
  if (repeatViews > 0) {
    score += repeatViews * 2;
    reasons.push(`Returned to ${repeatViews} listing${repeatViews === 1 ? "" : "s"} more than once`);
  }

  const saved = relationships.filter((r) => r.state === "saved").length;
  if (saved > 0) {
    score += saved * 2;
    reasons.push(`${saved} item${saved === 1 ? "" : "s"} saved`);
  }

  const proposals = activityEvents.filter((e) => e.kind === "proposal_generated").length;
  if (proposals > 0) {
    score += proposals * 3;
    reasons.push(`${proposals} proposal${proposals === 1 ? "" : "s"} generated`);
  }

  const rejected = relationships.filter((r) => r.state === "rejected").length;
  if (rejected > 0) {
    score -= rejected;
    reasons.push(`${rejected} option${rejected === 1 ? "" : "s"} actively ruled out`);
  }

  const unresolvedObjections = objections.filter((o) => !o.resolvedAt);
  if (unresolvedObjections.length >= 2) {
    score -= 3;
    reasons.push(`${unresolvedObjections.length} unresolved objections raised`);
  } else if (unresolvedObjections.length === 1) {
    score -= 1;
    reasons.push("An objection is still unresolved");
  }

  let level: IntentLevel;
  if (score >= 8) level = "very_high";
  else if (score >= 4) level = "high";
  else if (score >= 1) level = "medium";
  else level = "low";

  if (reasons.length === 0) reasons.push("No activity recorded yet for this buyer");

  return { level, reasons };
}

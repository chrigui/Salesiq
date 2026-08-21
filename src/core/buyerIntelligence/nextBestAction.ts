/**
 * Next Best Action — Wave 1 scope only (plan PR5/PR6): a lightweight,
 * real, rule-based hint read straight off the same evidence intent.ts and
 * purchaseReadiness.ts already compute. Not the full configurable NBA rule
 * engine the spec describes for later — that's Wave 2. Always returns one
 * concrete suggestion grounded in real records, or null when there's
 * nothing yet to act on (never a fabricated "get in touch!" filler).
 */
export interface NextBestActionInput {
  purchaseReadinessStage: string | null;
  unresolvedObjections: { kind: string; confidence: string }[];
  hasProposal: boolean;
  savedCount: number;
  hasFinancialInfo: boolean;
}

export function suggestNextBestAction(input: NextBestActionInput): string | null {
  const { purchaseReadinessStage, unresolvedObjections, hasProposal, savedCount, hasFinancialInfo } = input;

  if (unresolvedObjections.length > 0) {
    const top = unresolvedObjections.find((o) => o.confidence === "high") ?? unresolvedObjections[0];
    if (top.kind === "price" && !hasFinancialInfo) {
      return "Highest objection is price, and no financial preferences are on record yet — worth a direct conversation about budget and payment-plan options.";
    }
    if (top.kind === "financing") {
      return "A financing objection is unresolved — sharing payment-plan options directly may move this forward.";
    }
    return `An unresolved "${top.kind.replace(/-/g, " ")}" objection is likely the real blocker — address it directly before pushing another recommendation.`;
  }

  if (purchaseReadinessStage === "Decision Ready" && !hasProposal) {
    return "This buyer looks decision-ready but has no proposal yet — generate one and share it.";
  }

  if (savedCount >= 2 && !hasProposal) {
    return "Multiple items saved with no proposal yet — a side-by-side comparison or a proposal may help them decide.";
  }

  if (purchaseReadinessStage === "Exploring" || purchaseReadinessStage === null) {
    return "No engagement recorded yet — reach out to start the conversation.";
  }

  return null;
}

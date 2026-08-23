import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";

/**
 * Wave 2 buyer similarity — deterministic, weighted shared-attribute
 * matching, not a clustering/embedding model (no ML infrastructure to lean
 * on, and the codebase's standing rule is real-data-only and explainable).
 * Every match carries the literal reasons it matched; a bare similarity
 * percentage with no explanation is never returned.
 *
 * Deliberately does NOT compare financial/budget fields: `financial` is a
 * freeform Record<string, BuyerField> — the field key a salesperson types
 * (e.g. "Budget range") isn't a stable schema, so there's no reliable way
 * to compare two buyers' budgets without guessing at key names or parsing
 * freeform values. Guessing here would risk a fabricated-feeling match,
 * which the rest of Buyer Intelligence deliberately never does.
 */

export interface SimilarityCandidate {
  id: string;
  name: string;
  purposes: string[];
  priorities: BuyerPriority[] | null;
  intentLevel: string | null;
  purchaseReadiness: string | null;
}

export interface SimilarBuyerMatch {
  id: string;
  name: string;
  score: number;
  sharedReasons: string[];
}

const INTENT_LEVEL_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very high",
};

function scorePair(target: SimilarityCandidate, candidate: SimilarityCandidate): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const targetPurposes = new Set(target.purposes);
  for (const p of candidate.purposes) {
    if (targetPurposes.has(p)) {
      score += 2;
      reasons.push(`Same purpose: ${p}`);
    }
  }

  const targetRequirements = new Set((target.priorities ?? []).map((p) => p.requirement));
  for (const p of candidate.priorities ?? []) {
    if (targetRequirements.has(p.requirement)) {
      score += 3;
      reasons.push(`Both prioritize ${p.requirement}`);
    }
  }

  if (target.purchaseReadiness && target.purchaseReadiness === candidate.purchaseReadiness) {
    score += 2;
    reasons.push(`Same purchase readiness: ${target.purchaseReadiness}`);
  }

  if (target.intentLevel && target.intentLevel === candidate.intentLevel) {
    score += 1;
    reasons.push(`Same intent level: ${INTENT_LEVEL_LABEL[target.intentLevel] ?? target.intentLevel}`);
  }

  return { score, reasons };
}

/** Top matches for `target` among `candidates` (already scoped/filtered by the caller), highest score first. Never includes a zero-score "match" — no shared attributes means no real similarity to report. */
export function findSimilarBuyers(
  target: SimilarityCandidate,
  candidates: SimilarityCandidate[],
  limit = 5,
): SimilarBuyerMatch[] {
  return candidates
    .filter((c) => c.id !== target.id)
    .map((c) => {
      const { score, reasons } = scorePair(target, c);
      return { id: c.id, name: c.name, score, sharedReasons: reasons };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

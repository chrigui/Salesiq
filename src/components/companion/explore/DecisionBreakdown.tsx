"use client";

import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

type Strength = "Strong" | "Good" | "Moderate";

const STRENGTH_STYLE: Record<Strength, string> = {
  Strong: "text-emerald-400",
  Good: "text-brand",
  Moderate: "text-ink-faint",
};

interface BreakdownRow {
  label: string;
  strength: Strength;
}

/**
 * Salesperson-only rule-by-rule breakdown — never rendered on the Customer
 * Display (see WhyThisStage for the customer-facing simplification of the
 * same underlying data). Cross-references ScoredItem.breakdown
 * ({ruleId, contribution}) against the pack's own ruleSpecs ({id, weight})
 * to recover a per-rule contribution ratio, then buckets it into
 * Strong/Good/Moderate — a deterministic threshold ladder, never a second
 * scoring system. The overall score is always the real ScoredItem.score,
 * never re-derived from the buckets.
 */
function buildRows(pack: IndustryPack, scored: ScoredItem): BreakdownRow[] {
  const specs = pack.ruleSpecs ?? [];
  return scored.breakdown
    .map((entry) => {
      const spec = specs.find((s) => s.id === entry.ruleId);
      if (!spec || spec.weight <= 0) return null;
      const ratio = entry.contribution / spec.weight;
      const strength: Strength = ratio >= 0.8 ? "Strong" : ratio >= 0.5 ? "Good" : "Moderate";
      const label = pack.questions.find((q) => q.id === spec.questionId)?.label ?? spec.questionId;
      return { label, strength };
    })
    .filter((row): row is BreakdownRow => row !== null);
}

export function DecisionBreakdown({
  pack,
  scored,
  onClose,
}: {
  pack: IndustryPack;
  scored: ScoredItem;
  onClose: () => void;
}) {
  const rows = buildRows(pack, scored);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Decision breakdown</div>
        <h3 className="text-lg font-semibold text-ink">{scored.item.name}</h3>

        <dl className="mt-4 space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <dt className="text-ink-muted">{row.label}</dt>
              <dd className={STRENGTH_STYLE[row.strength]}>
                <span className="mr-1">{row.strength === "Moderate" ? "○" : "✓"}</span>
                {row.strength}
              </dd>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-ink-faint">No scoring rules configured for this pack.</p>}
        </dl>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm font-semibold text-ink">Overall</span>
          <span className="text-lg font-semibold text-brand">{scored.score} / 100</span>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
        >
          Close
        </button>
      </div>
    </div>
  );
}

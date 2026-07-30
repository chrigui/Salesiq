"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Fingerprint, Gauge, Wallet, ShieldCheck } from "lucide-react";
import { useSession } from "@/core/store/session";
import { buildSalesTwin } from "@/core/engine/salesTwin";
import { cx } from "@/components/ui/primitives";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

const PACE_COPY = {
  fast: { label: "Fast", detail: "Answering quickly — decisive, or already knows what they want." },
  steady: { label: "Steady", detail: "A comfortable, considered pace." },
  deliberate: { label: "Deliberate", detail: "Taking their time on each answer — worth checking for open questions." },
};

const BUDGET_COPY = {
  flexible: { label: "Flexible", className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  comfortable: { label: "Comfortable", className: "bg-sky-500/15 text-sky-300 ring-sky-500/30" },
  tight: { label: "Tight", className: "bg-rose-500/15 text-rose-300 ring-rose-500/30" },
};

const CONFIDENCE_COPY = {
  high: { label: "High", className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  medium: { label: "Medium", className: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
  low: { label: "Low", className: "bg-rose-500/15 text-rose-300 ring-rose-500/30" },
};

/**
 * AI Sales Twin (roadmap P2) — a live read of the real session, not a
 * fabricated persona. Every field traces back to buildSalesTwin(), which
 * only reads answers, timeline timestamps and the scoring engine's own
 * breakdown; anything it can't derive from real data (e.g. pace before two
 * answers exist) renders as an honest "—" rather than a guess.
 */
export function SalesTwin({
  open,
  onClose,
  pack,
  scored,
}: {
  open: boolean;
  onClose: () => void;
  pack: IndustryPack;
  scored: ScoredItem[];
}) {
  const { answers, timeline } = useSession();
  const twin = buildSalesTwin(pack, answers, timeline, scored);
  const confidenceCopy = CONFIDENCE_COPY[twin.confidence];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-strong flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Sales twin</h3>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="mb-4 text-xs text-ink-faint">
                A live read of this session, not a fabricated profile — every
                field below comes from real answers and timestamps, or shows
                as &ldquo;&mdash;&rdquo; when there isn&rsquo;t enough data yet.
              </p>

              <div className="mb-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Questionnaire progress</span>
                  <span className="font-semibold text-ink">{twin.progressPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${twin.progressPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                    <Gauge className="h-3 w-3" /> Pace
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    {twin.pace ? PACE_COPY[twin.pace].label : "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                    <Wallet className="h-3 w-3" /> Budget
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    {twin.budgetPosture ? BUDGET_COPY[twin.budgetPosture].label : "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                    <ShieldCheck className="h-3 w-3" /> Confidence
                  </div>
                  <div className={cx("inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1", confidenceCopy.className)}>
                    {confidenceCopy.label}
                  </div>
                </div>
              </div>

              {twin.pace && (
                <p className="mt-3 text-xs text-ink-faint">{PACE_COPY[twin.pace].detail}</p>
              )}

              <div className="mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Top decision drivers
                </div>
                {twin.topDrivers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {twin.topDrivers.map((d) => (
                      <span
                        key={d}
                        className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs text-brand"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-faint">
                    Not enough answered yet to tell which priority is driving the top pick.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

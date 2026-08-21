"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  BrainCircuit,
  Compass,
  Gauge,
  Info,
  AlertTriangle,
  ShieldQuestion,
  Wallet,
} from "lucide-react";
import { useSession } from "@/core/store/session";
import { useBuyerProfile, useBuyerObjections } from "@/core/store/buyerProfiles";
import { buildSalesTwin } from "@/core/engine/salesTwin";
import { detectSignals, type CopilotSignal, type CopilotSeverity } from "@/core/engine/copilot";
import { cx } from "@/components/ui/primitives";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

const SEVERITY_STYLE: Record<CopilotSeverity, { icon: typeof Info; className: string }> = {
  urgent: { icon: AlertTriangle, className: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30" },
  warn: { icon: AlertTriangle, className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30" },
  info: { icon: Info, className: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30" },
};

const INTENT_STYLE: Record<string, string> = {
  low: "bg-white/10 text-ink-muted",
  medium: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  high: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  very_high: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
};
const INTENT_LABEL: Record<string, string> = { low: "Low", medium: "Medium", high: "High", very_high: "Very high" };

const BUDGET_COPY = {
  flexible: { label: "Flexible", className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  comfortable: { label: "Comfortable", className: "bg-sky-500/15 text-sky-300 ring-sky-500/30" },
  tight: { label: "Tight", className: "bg-rose-500/15 text-rose-300 ring-rose-500/30" },
};
const PACE_LABEL = { fast: "Fast", steady: "Steady", deliberate: "Deliberate" };

/**
 * Buyer Intelligence live view — replaces the old separate Sales Twin and
 * Sales Copilot modals (spec §5-6, plan PR5). Two distinct layers, kept
 * visually separate rather than blended into one number: the buyer's
 * PERSISTED, evidence-backed intent/readiness (survives across sessions,
 * computed from BuyerActivityEvent/BuyerItemRelationship/BuyerObjection),
 * and THIS SESSION's live, ephemeral read (pace, budget posture, proactive
 * coaching signals) — the exact same deterministic logic Twin/Copilot always
 * used, just surfaced here instead of in their own modals.
 */
export function BuyerIntelligencePanel({
  open,
  onClose,
  pack,
  scored,
  onOpenObjectionHandler,
}: {
  open: boolean;
  onClose: () => void;
  pack: IndustryPack;
  scored: ScoredItem[];
  onOpenObjectionHandler: () => void;
}) {
  const { answers, timeline, bookmarks, buyerProfileId } = useSession();
  const { buyerProfile } = useBuyerProfile(buyerProfileId);
  const { objections } = useBuyerObjections(buyerProfileId);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [open]);

  const twin = buildSalesTwin(pack, answers, timeline, scored);
  const signals = detectSignals(pack, answers, timeline, bookmarks, scored, now);
  const unresolvedObjections = objections.filter((o) => !o.resolvedAt).length;

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
                <BrainCircuit className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Buyer intelligence</h3>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!buyerProfileId ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-ink-faint">
                  <BrainCircuit className="mx-auto mb-2 h-6 w-6 text-white/20" />
                  Add this customer&rsquo;s name and phone or email above to start tracking their buyer intelligence.
                </div>
              ) : (
                <>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    This buyer, across every session
                  </p>
                  <div className="mb-4 grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                        <Compass className="h-3 w-3" /> Intent
                      </div>
                      {buyerProfile?.intentLevel ? (
                        <span className={cx("inline-block rounded-full px-2 py-0.5 text-xs font-semibold", INTENT_STYLE[buyerProfile.intentLevel])}>
                          {INTENT_LABEL[buyerProfile.intentLevel]}
                        </span>
                      ) : (
                        <span className="text-sm text-ink-faint">—</span>
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                        <Gauge className="h-3 w-3" /> Readiness
                      </div>
                      <div className="text-sm font-semibold text-ink">{buyerProfile?.purchaseReadiness ?? "Exploring"}</div>
                      {buyerProfile?.purchaseReadinessConfidence != null && (
                        <div className="text-[10px] text-ink-faint">{buyerProfile.purchaseReadinessConfidence}% confidence</div>
                      )}
                    </div>
                  </div>
                  {buyerProfile?.intentReasons && buyerProfile.intentReasons.length > 0 && (
                    <p className="mb-4 text-xs text-ink-faint">{buyerProfile.intentReasons.join(" · ")}</p>
                  )}
                  {unresolvedObjections > 0 && (
                    <p className="mb-4 text-xs text-amber-300">
                      {unresolvedObjections} unresolved objection{unresolvedObjections === 1 ? "" : "s"} on record.
                    </p>
                  )}
                </>
              )}

              <p className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">This session</p>
              <p className="mb-3 text-xs text-ink-faint">
                Deterministic signals read straight off the live session — nothing predicted, nothing invented.
              </p>

              <div className="mb-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                    <Gauge className="h-3 w-3" /> Pace
                  </div>
                  <div className="text-sm font-semibold text-ink">{twin.pace ? PACE_LABEL[twin.pace] : "—"}</div>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                    <Wallet className="h-3 w-3" /> Budget
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    {twin.budgetPosture ? BUDGET_COPY[twin.budgetPosture].label : "—"}
                  </div>
                </div>
              </div>

              {signals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center text-sm text-ink-faint">
                  <Compass className="mx-auto mb-2 h-5 w-5 text-white/20" />
                  No live signals right now — the session looks on track.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {signals.map((s: CopilotSignal) => {
                    const style = SEVERITY_STYLE[s.severity];
                    return (
                      <div key={s.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className={cx("grid h-6 w-6 shrink-0 place-items-center rounded-full", style.className)}>
                            <style.icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-sm font-semibold text-ink">{s.title}</span>
                        </div>
                        <p className="pl-8 text-sm leading-relaxed text-ink-muted">{s.talkingPoint}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => {
                  onClose();
                  onOpenObjectionHandler();
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-white/10"
              >
                <ShieldQuestion className="h-4 w-4" /> Open objection handler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

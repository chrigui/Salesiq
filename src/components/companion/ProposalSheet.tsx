"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, FileText, Check } from "lucide-react";
import { useSession } from "@/core/store/session";
import { narrate, formatMoney } from "@/core/engine/explain";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

/**
 * Generates a client-ready proposal from the live session — the "Generate
 * proposal" action from the spec. Everything is derived from the answers and
 * the AI Decision Engine's reasons, so it is always consistent with what the
 * customer saw on screen.
 */
export function ProposalSheet({
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
  const { customer, answers } = useSession();
  const best = scored[0];
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
            className="glass-strong max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Proposal</h3>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <div className="text-base font-semibold">
                    {pack.branding.name}
                  </div>
                  <div className="text-xs text-ink-faint">{date}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/20 text-brand">
                  {pack.branding.logoGlyph}
                </div>
              </div>

              <div className="py-3">
                <div className="text-[11px] uppercase tracking-wide text-ink-faint">
                  Prepared for
                </div>
                <div className="text-sm font-medium">
                  {customer.name || "—"}
                </div>
                {customer.email && (
                  <div className="text-xs text-ink-faint">{customer.email}</div>
                )}
              </div>

              {best && (
                <div className="border-t border-white/5 pt-3">
                  <div className="text-[11px] uppercase tracking-wide text-ink-faint">
                    Recommended
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-semibold">
                      {best.item.name}
                    </span>
                    <span className="text-lg font-semibold text-brand">
                      {formatMoney(best.item.price, best.item.currency)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {narrate(best, pack)}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {best.item.highlights.map((h) => (
                      <div
                        key={h}
                        className="flex items-center gap-2 text-xs text-ink-muted"
                      >
                        <Check className="h-3.5 w-3.5 text-brand" /> {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-white/5 pt-3">
                <div className="text-[11px] uppercase tracking-wide text-ink-faint">
                  Alternatives considered
                </div>
                {scored.slice(1, 3).map((s) => (
                  <div
                    key={s.item.id}
                    className="mt-1.5 flex items-center justify-between text-sm"
                  >
                    <span className="text-ink-muted">{s.item.name}</span>
                    <span className="text-ink-faint">
                      {formatMoney(s.item.price, s.item.currency)} · {s.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-2xl bg-brand py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Export / Print
              </button>
              <button
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-ink-faint">
              Generated from {Object.keys(answers).length} answers · reasons
              verified by the decision engine
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

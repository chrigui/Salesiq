"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Compass, AlertTriangle, Info, ShieldQuestion } from "lucide-react";
import { useSession } from "@/core/store/session";
import { detectSignals, type CopilotSignal, type CopilotSeverity } from "@/core/engine/copilot";
import { cx } from "@/components/ui/primitives";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

const SEVERITY_STYLE: Record<CopilotSeverity, { icon: typeof Info; className: string }> = {
  urgent: { icon: AlertTriangle, className: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30" },
  warn: { icon: AlertTriangle, className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30" },
  info: { icon: Info, className: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30" },
};

/**
 * Sales Copilot (roadmap P2) — the proactive counterpart to the reactive
 * Objection Handler. It watches real session state (timeline, answers,
 * bookmarks, scores) and surfaces deterministic coaching signals; opening
 * the panel also refreshes a live clock so a stalled-session signal updates
 * in real time while it's open, not just at the moment it was opened.
 */
export function SalesCopilot({
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
  const { answers, timeline, bookmarks } = useSession();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [open]);

  const signals = detectSignals(pack, answers, timeline, bookmarks, scored, now);

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
                <Compass className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Sales copilot</h3>
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
                Deterministic signals read straight off this session — nothing
                predicted, nothing invented. When the customer actually says
                something, hand off to the Objection Handler for a grounded
                response.
              </p>

              {signals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-ink-faint">
                  <Compass className="mx-auto mb-2 h-6 w-6 text-white/20" />
                  No signals right now — the session looks on track.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {signals.map((s: CopilotSignal) => {
                    const style = SEVERITY_STYLE[s.severity];
                    return (
                      <div
                        key={s.id}
                        className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5"
                      >
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

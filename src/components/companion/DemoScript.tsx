"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Presentation, RotateCcw } from "lucide-react";
import { cx } from "@/components/ui/primitives";

export interface DemoStep {
  title: string;
  script: string;
  run: () => void;
}

/**
 * Demo Experience Mode (roadmap P2 / prior audit Feature 9). session.loadDemo()
 * already seeds a realistic scenario instantly — this orchestrates a guided
 * run through it, driving the real session state one scripted beat at a
 * time so the two live-synced surfaces (this phone and the customer
 * display) move together, instead of the presenter manually clicking
 * through in front of a prospect. Deliberately scoped to the surfaces that
 * are actually live-synced today (Companion + Display); it doesn't claim to
 * remote-control the Dashboard or Admin console in a separate browser tab,
 * which nothing in this architecture makes possible without a backend.
 *
 * Also powers the Golden Demo Experience (a second, longer 9-stage script —
 * see goldenDemoSteps.ts): the same component, a different `steps` array and
 * `label`, plus an optional `onReset` for scripts that have a curated
 * starting point worth restoring on demand.
 */
export function DemoScript({
  open,
  onClose,
  steps,
  label = "Guided demo",
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  steps: DemoStep[];
  label?: string;
  /** When provided, shows a Reset control that restarts the script from its curated beginning. */
  onReset?: () => void;
}) {
  const [i, setI] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (open && !ran.current) {
      ran.current = true;
      setI(0);
      steps[0]?.run();
    }
    if (!open) ran.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    setI(clamped);
    steps[clamped]?.run();
  };

  const handleReset = () => {
    onReset?.();
    setI(0);
    steps[0]?.run();
  };

  const step = steps[i];

  return (
    <AnimatePresence>
      {open && step && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
        >
          <div className="glass-strong w-full max-w-md rounded-3xl border border-brand/20 p-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand">
                <Presentation className="h-3.5 w-3.5" /> {label} · {i + 1}/{steps.length}
              </div>
              <div className="flex items-center gap-1">
                {onReset && (
                  <button
                    onClick={handleReset}
                    aria-label="Reset demo"
                    title="Reset demo to the start"
                    className="grid h-6 w-6 place-items-center rounded-full bg-white/5 text-ink-faint hover:bg-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  aria-label="Exit guided demo"
                  className="grid h-6 w-6 place-items-center rounded-full bg-white/5 text-ink-faint hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Jump to any step — a presenter live on stage needs to skip around, not just step forward/back. */}
            {steps.length > 1 && (
              <div className="mb-2.5 flex flex-wrap gap-1">
                {steps.map((s, idx) => (
                  <button
                    key={s.title}
                    onClick={() => go(idx)}
                    title={s.title}
                    aria-label={`Jump to step ${idx + 1}: ${s.title}`}
                    aria-current={idx === i}
                    className={cx(
                      "grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold transition",
                      idx === i
                        ? "bg-brand text-white"
                        : "bg-white/5 text-ink-faint hover:bg-white/10",
                    )}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-1 text-sm font-semibold text-ink">{step.title}</div>
            <p className="mb-3 text-sm leading-snug text-ink-muted">{step.script}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => go(i - 1)}
                disabled={i === 0}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-muted transition hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
              {i < steps.length - 1 ? (
                <button
                  onClick={() => go(i + 1)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="flex-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                >
                  Finish
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

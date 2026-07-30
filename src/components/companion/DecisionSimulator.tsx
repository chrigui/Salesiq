"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sliders, RotateCcw, ArrowRight, TrendingUp } from "lucide-react";
import { scoreInventory, isVisible } from "@/core/engine/scoring";
import { formatMoney } from "@/core/engine/explain";
import { cx } from "@/components/ui/primitives";
import { Stepper, SingleSlider, BudgetControl } from "./CompanionApp";
import type { Answers, BudgetValue, IndustryPack } from "@/core/types";

const SIMULATABLE = ["budget", "counter", "slider", "toggle"] as const;

/**
 * Decision Simulator (roadmap P1). "What happens if budget increases?" —
 * answered instantly, because scoreInventory(pack, answers) is already a
 * pure function; this just calls it again with hypothetical answers
 * instead of the real ones. Runs entirely as local component state — it
 * never writes to the shared session, so exploring "what if" never risks
 * corrupting the live interview a customer is actually answering.
 */
export function DecisionSimulator({
  open,
  onClose,
  pack,
  answers,
}: {
  open: boolean;
  onClose: () => void;
  pack: IndustryPack;
  answers: Answers;
}) {
  const [overrides, setOverrides] = useState<Answers>(answers);

  useEffect(() => {
    if (open) setOverrides(answers);
  }, [open, answers]);

  const questions = pack.questions.filter(
    (q) => SIMULATABLE.includes(q.type as (typeof SIMULATABLE)[number]) && isVisible(q, overrides),
  );

  const baseline = scoreInventory(pack, answers);
  const simulated = scoreInventory(pack, overrides);
  const baselineTop = baseline[0];
  const simulatedTop = simulated[0];
  const changed = baselineTop && simulatedTop && baselineTop.item.id !== simulatedTop.item.id;
  const dirty = JSON.stringify(overrides) !== JSON.stringify(answers);

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
                <Sliders className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Decision simulator</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {dirty && (
                  <button
                    onClick={() => setOverrides(answers)}
                    aria-label="Reset to real answers"
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="mb-4 text-xs text-ink-faint">
                Drag anything below to see the recommendation update instantly
                — nothing here changes the real session until you say so.
              </p>

              <div className="space-y-3">
                {questions.map((q) => {
                  const value = overrides[q.id];
                  return (
                    <div key={q.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                      <div className="mb-2.5 text-sm font-medium text-ink">{q.label}</div>
                      {q.type === "toggle" && (
                        <div className="flex gap-2">
                          {[
                            ["Yes", true],
                            ["No", false],
                          ].map(([label, v]) => (
                            <button
                              key={label as string}
                              onClick={() => setOverrides((o) => ({ ...o, [q.id]: v as boolean }))}
                              className={cx(
                                "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition",
                                value === v ? "bg-brand text-white" : "bg-white/5 text-ink-muted hover:bg-white/10",
                              )}
                            >
                              {label as string}
                            </button>
                          ))}
                        </div>
                      )}
                      {q.type === "counter" && (
                        <Stepper
                          value={typeof value === "number" ? value : q.min ?? 0}
                          min={q.min ?? 0}
                          max={q.max ?? 10}
                          onChange={(v) => setOverrides((o) => ({ ...o, [q.id]: v }))}
                        />
                      )}
                      {q.type === "slider" && (
                        <SingleSlider
                          value={typeof value === "number" ? value : q.min ?? 0}
                          min={q.min ?? 0}
                          max={q.max ?? 100}
                          step={q.step ?? 1}
                          unit={q.unit}
                          onChange={(v) => setOverrides((o) => ({ ...o, [q.id]: v }))}
                        />
                      )}
                      {q.type === "budget" && (
                        <BudgetControl
                          question={q}
                          value={
                            value && typeof value === "object" && "max" in value
                              ? (value as BudgetValue)
                              : { min: q.min ?? 0, max: q.max ?? 0 }
                          }
                          onChange={(v) => setOverrides((o) => ({ ...o, [q.id]: v }))}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  <TrendingUp className="h-3.5 w-3.5" /> Simulated result
                </div>

                {changed && baselineTop && simulatedTop ? (
                  <div className="mb-3 flex items-center gap-2 rounded-xl bg-brand/15 px-3 py-2 text-sm ring-1 ring-brand/30">
                    <span className="text-ink-muted line-through">{baselineTop.item.name}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand" />
                    <span className="font-semibold text-brand">{simulatedTop.item.name}</span>
                  </div>
                ) : (
                  <p className="mb-3 text-xs text-ink-faint">
                    Top pick stays {simulatedTop?.item.name ?? "the same"} under these conditions.
                  </p>
                )}

                <div className="space-y-2">
                  {simulated.slice(0, 3).map((s, i) => (
                    <div
                      key={s.item.id}
                      className={cx(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
                        i === 0 ? "bg-brand/10 ring-1 ring-brand/25" : "bg-white/[0.02]",
                      )}
                    >
                      <span className={i === 0 ? "font-semibold text-ink" : "text-ink-muted"}>
                        {s.item.name}
                      </span>
                      <span className="flex items-center gap-3 text-xs text-ink-faint">
                        {formatMoney(s.item.price, s.item.currency)}
                        <span className={cx("font-semibold tabular-nums", i === 0 ? "text-brand" : "text-ink-muted")}>
                          {s.score}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

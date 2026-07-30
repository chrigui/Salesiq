"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { fadeUp, staggerChildren, revealOnScroll } from "@/lib/motion";
import { IllustrativeNote } from "@/components/marketing/illustrative-note";

const CANDIDATES = [
  { name: "Harbor Point Residence", score: 94 },
  { name: "Meridian Loft 12B", score: 71 },
  { name: "Old Quarter Townhouse", score: 52 },
];

/**
 * A staged, scroll-driven walkthrough of the Decision Engine's real
 * mechanic — deterministic, explainable scoring, the same logic behind the
 * live product's "Why This / Why Not" panel. The numbers below are a
 * representative example, not a live query against production data — the
 * IllustrativeNote says so; the *mechanic* being shown (score, then
 * explain) is real.
 */
export function DecisionEnginePreview() {
  return (
    <motion.div
      {...revealOnScroll}
      variants={staggerChildren}
      className="grid gap-5 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8 lg:grid-cols-3"
    >
      <motion.div variants={fadeUp} className="flex flex-col gap-3">
        <span className="eyebrow text-accent-ink">01 · Ask</span>
        <p className="text-[14.5px] text-ink-muted">
          A few guided questions capture what actually matters to this buyer.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {["Budget: $850k–$1.1M", "Move-in: 60 days", "Must: home office"].map((chip) => (
            <span key={chip} className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[12.5px] text-ink-muted">
              {chip}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-col gap-3">
        <span className="eyebrow text-accent-ink">02 · Score</span>
        <p className="text-[14.5px] text-ink-muted">
          Every option is scored against those answers — transparently, not as a black box.
        </p>
        <div className="mt-1 flex flex-col gap-2.5">
          {CANDIDATES.map((c) => (
            <div key={c.name}>
              <div className="mb-1 flex items-center justify-between text-[12.5px] text-ink-muted">
                <span>{c.name}</span>
                <span className="tabular-nums text-ink">{c.score}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${c.score}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-col gap-3">
        <span className="eyebrow text-accent-ink">03 · Explain</span>
        <p className="text-[14.5px] text-ink-muted">The top match, with the reasoning shown — not just asserted.</p>
        <ul className="mt-1 flex flex-col gap-2 text-[13px]">
          <li className="flex items-start gap-2 text-ink">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-good" aria-hidden="true" />
            Within budget, dedicated office
          </li>
          <li className="flex items-start gap-2 text-ink">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-good" aria-hidden="true" />
            Ready in 45 days — beats the deadline
          </li>
          <li className="flex items-start gap-2 text-ink-muted">
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pending" aria-hidden="true" />
            Runner-up: no dedicated office
          </li>
        </ul>
      </motion.div>

      <div className="lg:col-span-3">
        <IllustrativeNote>
          Representative walkthrough — the scoring logic shown is the live product&rsquo;s Decision Engine; the example above isn&rsquo;t a live query.
        </IllustrativeNote>
      </div>
    </motion.div>
  );
}

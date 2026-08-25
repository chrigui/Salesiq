"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import type { ScoredItem } from "@/core/engine/scoring";
import type { IndustryPack } from "@/core/types";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/** Same "score >= 60" tier narrate()/DecisionSimulator already call "a strong match" — reused here, never a second threshold. */
const STRONG_MATCH_SCORE = 60;

/**
 * Total on-screen time for the MATCHING sequence — exported so the
 * Companion's own hand-off timer (RequirementConfirmation.tsx) can advance
 * session.view to "matches" in lockstep with this component's own
 * animation, rather than guessing a duration independently.
 */
export const MATCHING_DURATION_MS = 3200;

const SEARCHING_PHASE_MS = 900;
const TOTAL_PHASE_MS = 1300;

type Phase = "searching" | "total" | "matches";

/**
 * Spec section 8: a cinematic transition from Discovery to Matches — never
 * a loading spinner, never a fabricated market-wide funnel (this app has
 * no data on "the wider universe" of properties). Shows exactly two real
 * numbers: the pack's own total inventory count, then the real count of
 * items crossing the existing "strong match" threshold — a real, honest
 * two-step narrowing, not an invented sequence of intermediate counts.
 */
export function MatchingStage({ pack, scored }: { pack: IndustryPack; scored: ScoredItem[] }) {
  const [phase, setPhase] = useState<Phase>("searching");
  const totalCount = pack.inventory.length;
  const matchCount = scored.filter((s) => s.score >= STRONG_MATCH_SCORE).length;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("total"), SEARCHING_PHASE_MS);
    const t2 = setTimeout(() => setPhase("matches"), SEARCHING_PHASE_MS + TOTAL_PHASE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={spring}
      className="flex w-full max-w-2xl flex-col items-center text-center"
    >
      <AnimatePresence mode="wait">
        {phase === "searching" && (
          <motion.div
            key="searching"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={spring}
            className="flex flex-col items-center gap-4"
          >
            <Search className="h-8 w-8 text-brand" />
            <div className="text-3xl font-semibold uppercase tracking-[0.2em]">Searching</div>
          </motion.div>
        )}

        {phase === "total" && (
          <motion.div
            key="total"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={spring}
            className="flex flex-col items-center gap-2"
          >
            <div className="text-6xl font-semibold tabular-nums text-gradient">{totalCount}</div>
            <div className="text-sm uppercase tracking-[0.2em] text-ink-faint">
              propert{totalCount === 1 ? "y" : "ies"} in view
            </div>
          </motion.div>
        )}

        {phase === "matches" && (
          <motion.div
            key="matches"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={spring}
            className="flex flex-col items-center gap-3"
          >
            <div className="text-6xl font-semibold tabular-nums text-gradient">{matchCount}</div>
            <div className="text-xl font-medium">
              PROPERT{matchCount === 1 ? "Y" : "IES"} MATCH{matchCount === 1 ? "ES" : ""} YOUR REQUIREMENTS
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/**
 * Spec section 21/23: "LUMMA Recap" is explicitly the *next* stage after
 * this one, not built here — DecisionRoomRecommend.tsx's [CREATE LUMMA
 * RECAP] button stays visibly disabled, so this view has no reachable
 * trigger in the built UI today. It exists only so the Display's state
 * machine has no dead branch for "recap" — an honest "coming soon" rather
 * than a blank screen, should the view ever be reached.
 */
export function RecapStage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="flex w-full max-w-md flex-col items-center text-center"
    >
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand">
        <ClipboardList className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">LUMMA Recap</h2>
      <p className="mt-2 text-sm text-ink-faint">Coming soon.</p>
    </motion.div>
  );
}

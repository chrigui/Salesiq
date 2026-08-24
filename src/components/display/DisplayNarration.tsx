"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DisplayView } from "@/core/store/session";

/**
 * A brief cinematic caption that plays over the Display whenever the
 * customer's screen genuinely changes to a new kind of moment — never a
 * parallel rendering path, just a copy overlay keyed off the real `view`
 * transitions the rest of DisplayStage already drives. No new synced state:
 * this reacts to the same `view` value everything else renders from, so it
 * can never drift out of sync with what the customer is actually looking
 * at. There's deliberately no beat for "browsing all properties" — that
 * happens entirely on the Companion's side with no corresponding Display
 * view to hang a caption on, and inventing one would be exactly the kind
 * of fabricated state this feature avoids everywhere else.
 */
const BEATS: Partial<Record<DisplayView, string[]>> = {
  recommendation: ["We heard you.", "Here's what we found."],
  compare: ["Your top options, side by side."],
  compareGroup: ["Comparing your options."],
  item: ["Why this one fits."],
};

const BEAT_MS = 1500;

export function DisplayNarration({ view }: { view: DisplayView }) {
  const previousView = useRef<DisplayView>(view);
  const [beats, setBeats] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (previousView.current === view) return;
    previousView.current = view;
    setBeats(BEATS[view] ?? []);
    setIndex(0);
  }, [view]);

  useEffect(() => {
    if (beats.length === 0) return;
    if (index >= beats.length) {
      const clear = setTimeout(() => setBeats([]), 0);
      return () => clearTimeout(clear);
    }
    const advance = setTimeout(() => setIndex((i) => i + 1), BEAT_MS);
    return () => clearTimeout(advance);
  }, [beats, index]);

  const current = beats[index];
  if (!current) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] grid place-items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="rounded-full bg-black/60 px-8 py-4 text-2xl font-semibold text-white backdrop-blur-md"
        >
          {current}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

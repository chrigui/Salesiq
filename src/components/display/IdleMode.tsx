"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Hand, MapPin } from "lucide-react";
import type { IndustryPack } from "@/core/types";
import { formatMoney } from "@/core/engine/explain";
import { ItemImage } from "@/components/ui/ItemImage";
import { cx } from "@/components/ui/primitives";

/** How long the display waits with no activity before showing the attract loop. */
export const DEFAULT_IDLE_TIMEOUT_MS = 45_000;
/** How long each featured item holds before the carousel advances. */
const SLIDE_MS = 6_000;

const AI_PROMPTS = [
  "Ask our AI: “Find me something under 300k near good schools.”",
  "Ask our AI: “Which of these has the best investment upside?”",
  "Ask our AI: “Compare the top two for a family of four.”",
];

/**
 * Idle-timeout gate. Arms a countdown whenever `enabled` is true; any local
 * pointer/keyboard activity — or a change to `resetKey` (the session's
 * revision counter, so a companion action always counts as activity) —
 * restarts the clock. `wake()` is exposed for click-to-dismiss.
 */
export function useIdleGate({
  enabled,
  timeoutMs,
  resetKey,
}: {
  enabled: boolean;
  timeoutMs: number;
  resetKey: unknown;
}): { isIdle: boolean; wake: () => void } {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<number | null>(null);

  const arm = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setIsIdle(true), timeoutMs);
  }, [timeoutMs]);

  const wake = useCallback(() => {
    setIsIdle(false);
    if (enabled) arm();
  }, [enabled, arm]);

  useEffect(() => {
    if (!enabled) {
      setIsIdle(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      return;
    }
    arm();
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
    // resetKey (session revision) intentionally re-arms the timer on any
    // remote/companion activity, not just local input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, timeoutMs, resetKey]);

  return { isIdle, wake };
}

/**
 * The attract loop — Module 2 "Idle Mode". Runs when nobody is interacting:
 * a slow-panning carousel of the pack's own inventory photography stands in
 * for a video background (no media pipeline exists yet, so real photography
 * with Ken Burns motion carries the same cinematic language honestly),
 * rotating highlights read like "Promotions", and a pulsing AI presence
 * cycles through example questions in place of a literal avatar video.
 */
export function IdleScreen({
  pack,
  onWake,
}: {
  pack: IndustryPack;
  onWake: () => void;
}) {
  const items = pack.inventory;
  const [index, setIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % items.length),
      SLIDE_MS,
    );
    return () => window.clearInterval(id);
  }, [items.length]);

  useEffect(() => {
    const id = window.setInterval(
      () => setPromptIndex((i) => (i + 1) % AI_PROMPTS.length),
      6_000,
    );
    return () => window.clearInterval(id);
  }, []);

  const current = items[index];

  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      onClick={onWake}
      role="button"
      tabIndex={0}
      aria-label="Tap to begin"
      className="fixed inset-0 z-[80] cursor-pointer overflow-hidden bg-black"
    >
      {/* Background carousel — Ken Burns cross-fade through the featured items */}
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.08 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.2 }, scale: { duration: SLIDE_MS / 1000 + 1, ease: "linear" } }}
          className="absolute inset-0"
        >
          <ItemImage image={current.image} photo={current.photo} className="h-full w-full" />
        </motion.div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/70" />

      {/* Brand */}
      <div className="absolute left-8 top-8 flex items-center gap-2.5 text-white">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-lg ring-1 ring-white/20 backdrop-blur-xl">
          {pack.branding.logoGlyph}
        </div>
        <div>
          <div className="text-base font-semibold leading-tight">{pack.branding.name}</div>
          <div className="text-[11px] text-white/50">{pack.branding.tagline}</div>
        </div>
      </div>

      {/* Center — headline + tap prompt */}
      <div className="absolute inset-0 grid place-items-center px-8 text-center">
        <div>
          <motion.h1
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-white"
          >
            Let&rsquo;s find the one that&rsquo;s right for you
          </motion.h1>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm text-white/90 backdrop-blur-xl"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <Sparkles className="h-4 w-4 text-brand" />
            <motion.span key={promptIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {AI_PROMPTS[promptIndex]}
            </motion.span>
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mt-14 flex items-center gap-2 text-white/70"
          >
            <Hand className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-[0.2em]">
              Touch to begin
            </span>
          </motion.div>
        </div>
      </div>

      {/* Bottom — featured item strip */}
      {current && (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-8">
          <motion.div
            key={current.id + "-card"}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 text-white backdrop-blur-xl"
          >
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
              Featured
            </div>
            <div className="mt-1 text-lg font-semibold">{current.name}</div>
            <div className="text-sm text-white/70">
              {formatMoney(current.price, current.currency)}
              {current.highlights[0] && (
                <span className="text-white/50"> · {current.highlights[0]}</span>
              )}
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            {current.lifestyle && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs text-white/80 backdrop-blur-xl">
                <MapPin className="h-3.5 w-3.5" /> Explore neighborhoods interactively
              </span>
            )}
            <div className="flex items-center gap-1.5">
              {items.map((it, i) => (
                <span
                  key={it.id}
                  className={cx(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/30",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

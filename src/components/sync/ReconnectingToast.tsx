"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { useSync } from "@/components/providers/SyncProvider";
import { cx } from "@/components/ui/primitives";

/**
 * A small, unobtrusive toast for flaky (mobile) networks. It only appears once
 * a pairing has actually been established and then drops — so it never nags
 * during the normal first connect — and shows a brief "Reconnected" when the
 * link recovers.
 */
export function ReconnectingToast() {
  const { role, room, status } = useSync();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"reconnecting" | "reconnected">(
    "reconnecting",
  );
  const everConnected = useRef(false);
  const prevStatus = useRef(status);

  useEffect(() => {
    if (!role || !room) return;
    const up = status === "paired" || status === "connected";
    const down = status === "connecting" || status === "error";
    const wasDown =
      prevStatus.current === "connecting" || prevStatus.current === "error";

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (up) {
      if (everConnected.current && wasDown) {
        // Recovered from a drop.
        setMode("reconnected");
        setVisible(true);
        timer = setTimeout(() => setVisible(false), 2200);
      }
      everConnected.current = true;
    } else if (down && everConnected.current) {
      setMode("reconnecting");
      setVisible(true);
    }
    prevStatus.current = status;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [status, role, room]);

  if (!role) return null;

  // Keep clear of each surface's own chrome.
  const position =
    role === "companion"
      ? "bottom-4 left-1/2 -translate-x-1/2"
      : "top-14 left-1/2 -translate-x-1/2";

  const reconnecting = mode === "reconnecting";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: role === "companion" ? 12 : -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: role === "companion" ? 12 : -12, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className={cx(
            "fixed z-[80] flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-xl",
            position,
            reconnecting
              ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
              : "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
          )}
          role="status"
          aria-live="polite"
        >
          {reconnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Reconnecting…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Reconnected
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

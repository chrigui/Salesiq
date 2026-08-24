"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Monitor, X } from "lucide-react";

/** Chromium's install-prompt event — not yet in lib.dom.d.ts. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "salesiq.companion.installPromptDismissed";

/**
 * Turns the Companion into a real installable PWA and asks the user to add
 * it to their desktop. Registers the Companion-scoped service worker
 * (public/sw.js — see its own header comment for what it does and doesn't
 * cache) on mount, then listens for Chromium's real `beforeinstallprompt`
 * event and surfaces it as an in-app banner instead of relying on the
 * browser's own address-bar install icon, which most people never notice.
 * Firefox and Safari never fire this event (no native install flow to hook
 * into), so the banner simply never appears there — no fallback is faked.
 */
export function CompanionInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/companion" }).catch(() => {
        // Registration can fail (e.g. unsupported browser) — the app still
        // works as a normal tab, it just won't be installable.
      });
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      let dismissedBefore = false;
      try {
        dismissedBefore = localStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        /* localStorage can be unavailable — just show the banner */
      }
      if (!dismissedBefore) setVisible(true);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* best-effort only — worst case the banner reappears next visit */
    }
  };

  if (installed || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden border-b border-white/5"
      >
        <div className="flex items-center gap-3 bg-brand/10 px-5 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/20 text-brand">
            <Monitor className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink">Add to your desktop</div>
            <div className="text-xs text-ink-faint">
              Launch the Sales Companion instantly, full-screen, without a browser tab.
            </div>
          </div>
          <button
            onClick={() => void install()}
            className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Add
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

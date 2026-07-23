"use client";

import { useEffect, useState } from "react";

/**
 * Keeps the Customer Display awake through a long pitch (Screen Wake Lock),
 * re-acquiring when the tab regains visibility. Renders nothing — the
 * fullscreen control lives in the display's own control cluster.
 * Progressive enhancement: a no-op where unsupported.
 */
export function DisplayKiosk() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        const wl = (
          navigator as Navigator & {
            wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinel> };
          }
        ).wakeLock;
        if (wl && !cancelled) lock = await wl.request("screen");
      } catch {
        /* user gesture may be required, or unsupported — ignore */
      }
    };
    request();
    const onVis = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);

  return null;
}

/** Small fullscreen toggle hook for the display's control cluster. */
export function useFullscreen(): [boolean, () => void] {
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const onChange = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };
  return [fs, toggle];
}

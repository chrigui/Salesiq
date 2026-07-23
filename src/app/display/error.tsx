"use client";

import { useEffect } from "react";

/**
 * Display-specific fallback. The customer-facing screen must never show a raw
 * stack trace, so this is a calm, branded holding screen that auto-recovers.
 */
export default function DisplayError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Auto-retry shortly so a transient glitch self-heals on the big screen.
    const t = setTimeout(reset, 2500);
    return () => clearTimeout(t);
  }, [error, reset]);

  return (
    <div className="bg-aurora grid h-screen w-screen place-items-center">
      <div className="text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-brand" />
        <p className="text-lg font-medium text-ink-muted">
          One moment&hellip;
        </p>
      </div>
    </div>
  );
}

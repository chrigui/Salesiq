"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

/** App-level error boundary — keeps a stray render error from white-screening. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would go to Sentry/logging.
    console.error(error);
  }, [error]);

  return (
    <main className="bg-aurora grid min-h-screen place-items-center px-6">
      <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/20 text-2xl text-brand ring-1 ring-brand/30">
          ◈
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Something interrupted the session
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          The presentation hit an unexpected error. Nothing was lost — you can
          pick up right where you were.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <RotateCcw className="h-4 w-4" /> Resume
        </button>
      </div>
    </main>
  );
}

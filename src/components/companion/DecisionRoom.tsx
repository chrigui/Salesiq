"use client";

import { useMeetingFlow } from "./meetingFlow";

/**
 * The Decision Room — where the salesperson stops browsing and starts
 * guiding the customer toward a decision. Stub for now; filled in across
 * the Decision Room PR series (entering screen, comparison, priorities,
 * simulator, recommendation).
 */
export function DecisionRoom() {
  const flow = useMeetingFlow();

  return (
    <div className="bg-aurora flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-ink-faint">The Decision Room is being built.</p>
      <button
        onClick={() => flow.goTo("explore")}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-ink-muted transition hover:bg-white/10"
      >
        Back to matches
      </button>
    </div>
  );
}

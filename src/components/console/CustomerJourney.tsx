"use client";

import { Panel } from "@/components/console/light-ui";
import { journeyPaths } from "@/lib/analytics";

/**
 * Customer Journey Analytics (Module 8). The two most common paths a
 * customer takes through a session, and where each one loses people —
 * aggregated across sessions, unlike the per-session Session Timeline
 * (Module 3), which shows one customer's own path.
 */
export function CustomerJourney() {
  return (
    <div className="space-y-4">
      {journeyPaths.map((path) => {
        const first = path.steps[0].reached;
        return (
          <Panel key={path.label} title={path.label}>
            <div className="flex flex-wrap items-stretch gap-2">
              {path.steps.map((s, i) => {
                const pct = Math.round((s.reached / first) * 100);
                const next = path.steps[i + 1];
                const dropOff = next ? Math.round(((s.reached - next.reached) / s.reached) * 100) : 0;
                return (
                  <div key={s.step} className="flex items-center gap-2">
                    <div className="min-w-[110px] rounded-2xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs font-medium text-zinc-900">{s.step}</div>
                      <div className="text-lg font-bold tabular-nums text-zinc-900">
                        {s.reached.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-zinc-400">{pct}% of start</div>
                    </div>
                    {next && (
                      <div className="flex flex-col items-center px-1 text-[10px] text-zinc-400">
                        <span>→</span>
                        {dropOff > 15 && <span className="text-rose-500">-{dropOff}%</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

"use client";

import { Sparkles, Target, TrendingUp } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useLeads } from "@/core/store/leads";

/**
 * AI Analytics (Module 8). Unlike the rest of this dashboard's mock
 * figures, these numbers are computed live from real captured leads
 * (core/store/leads.ts) — every lead carries the Decision Engine's actual
 * score at capture time and its real outcome (status), so acceptance rate
 * and the confidence/outcome correlation are genuine, not simulated.
 */
export function AiAnalytics() {
  const leads = useLeads();

  if (leads.length === 0) {
    return (
      <Panel title="AI analytics">
        <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
          No leads captured yet — these stats compute live from real
          recommendation scores once sessions start converting to leads.
        </div>
      </Panel>
    );
  }

  const decided = leads.filter((l) => l.status === "won" || l.status === "lost");
  const won = leads.filter((l) => l.status === "won");
  const acceptanceRate = decided.length ? Math.round((won.length / decided.length) * 100) : 0;
  const avgConfidence = Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length);

  const highConfidence = decided.filter((l) => l.score >= 70);
  const lowConfidence = decided.filter((l) => l.score < 70);
  const highWinRate = highConfidence.length
    ? Math.round((highConfidence.filter((l) => l.status === "won").length / highConfidence.length) * 100)
    : null;
  const lowWinRate = lowConfidence.length
    ? Math.round((lowConfidence.filter((l) => l.status === "won").length / lowConfidence.length) * 100)
    : null;

  const buckets = [
    { label: "90-100", min: 90, max: 100 },
    { label: "70-89", min: 70, max: 89 },
    { label: "50-69", min: 50, max: 69 },
    { label: "0-49", min: 0, max: 49 },
  ].map((b) => ({
    ...b,
    count: leads.filter((l) => l.score >= b.min && l.score <= b.max).length,
  }));
  const maxBucket = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <TrendingUp className="h-3.5 w-3.5" /> Acceptance rate
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {decided.length ? `${acceptanceRate}%` : "—"}
          </div>
          <div className="text-xs text-zinc-400">
            {won.length} won of {decided.length} decided
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <Sparkles className="h-3.5 w-3.5" /> Avg. confidence
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {avgConfidence}
          </div>
          <div className="text-xs text-zinc-400">across {leads.length} recommendations</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <Target className="h-3.5 w-3.5" /> High-confidence win rate
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {highWinRate != null ? `${highWinRate}%` : "—"}
          </div>
          <div className="text-xs text-zinc-400">
            {lowWinRate != null ? `vs ${lowWinRate}% below 70` : "score ≥ 70, decided leads only"}
          </div>
        </div>
      </div>

      <Panel title="Confidence distribution">
        <p className="mb-4 text-sm text-zinc-500">
          How many captured recommendations fell in each score band — a
          healthy engine skews toward the top.
        </p>
        <div className="space-y-3">
          {buckets.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <div className="w-16 shrink-0 text-sm text-zinc-600">{b.label}</div>
              <div className="h-6 flex-1 overflow-hidden rounded-lg bg-zinc-100">
                <div
                  className={cx(
                    "flex h-full items-center justify-end rounded-lg pr-2 text-xs font-medium text-white",
                    b.min >= 70 ? "bg-emerald-500" : b.min >= 50 ? "bg-amber-500" : "bg-zinc-400",
                  )}
                  style={{ width: `${Math.max(6, (b.count / maxBucket) * 100)}%` }}
                >
                  {b.count > 0 ? b.count : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

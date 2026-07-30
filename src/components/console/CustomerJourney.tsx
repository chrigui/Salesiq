"use client";

import { Route } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useLeads, LEAD_STATUSES, type LeadStatus } from "@/core/store/leads";

const STAGE_LABEL: Record<Exclude<LeadStatus, "lost">, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
};

/**
 * Customer Journey (Module 8). Every captured lead's real, current status —
 * not a fabricated multi-thousand-session funnel. There's no persisted
 * history of session-by-session progress to aggregate (this pilot has no
 * backend — see docs/overview.html's own roadmap), so rather than invent
 * one, this shows the real pipeline distribution: how many leads sit at
 * each stage right now, computed live from core/store/leads.ts.
 */
export function CustomerJourney() {
  const leads = useLeads();

  if (leads.length === 0) {
    return (
      <Panel title="Customer journey">
        <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          <Route className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
          No leads captured yet — the pipeline fills in live as sessions
          convert to leads.
        </div>
      </Panel>
    );
  }

  const stages = LEAD_STATUSES.filter((s) => s !== "lost") as Exclude<LeadStatus, "lost">[];
  const counts = stages.map((s) => ({
    stage: s,
    label: STAGE_LABEL[s],
    count: leads.filter((l) => l.status === s).length,
  }));
  const lost = leads.filter((l) => l.status === "lost").length;
  const decided = leads.filter((l) => l.status === "won" || l.status === "lost").length;
  const won = leads.filter((l) => l.status === "won").length;
  const winRate = decided > 0 ? Math.round((won / decided) * 100) : null;
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <Panel title="Customer journey">
      <p className="mb-4 text-sm text-zinc-500">
        Where every captured lead sits in the pipeline right now, computed
        from real lead records — not a simulated session funnel.
      </p>
      <div className="flex flex-wrap items-stretch gap-2">
        {counts.map((c, i) => (
          <div key={c.stage} className="flex items-center gap-2">
            <div
              className="min-w-[110px] rounded-2xl border border-zinc-200 bg-white p-3"
              style={{ opacity: 0.55 + 0.45 * (c.count / max) }}
            >
              <div className="text-xs font-medium text-zinc-900">{c.label}</div>
              <div className="text-lg font-bold tabular-nums text-zinc-900">{c.count}</div>
              <div className="text-[11px] text-zinc-400">
                {leads.length ? Math.round((c.count / leads.length) * 100) : 0}% of leads
              </div>
            </div>
            {i < counts.length - 1 && <span className="px-1 text-zinc-300">→</span>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 border-t border-zinc-100 pt-3 text-sm">
        <span className="text-zinc-500">
          <span className={cx("font-semibold", winRate != null && winRate >= 50 ? "text-emerald-600" : "text-zinc-900")}>
            {winRate != null ? `${winRate}%` : "—"}
          </span>{" "}
          win rate ({won} won of {decided} decided)
        </span>
        {lost > 0 && <span className="text-zinc-400">{lost} lost</span>}
      </div>
    </Panel>
  );
}

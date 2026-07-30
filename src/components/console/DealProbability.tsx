"use client";

import { Radar, Flame, ThermometerSun, Snowflake, AlertTriangle } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useLeads, type Lead } from "@/core/store/leads";
import { formatMoney } from "@/core/engine/explain";

/**
 * Deal Probability Radar (roadmap P1). A deterministic heuristic over real
 * lead data — status stage blended with the Decision Engine's own match
 * score — not a fabricated ML prediction. There's no historical event log
 * of status changes to compute true "momentum" from (this pilot has no
 * persisted session/CRM history — see the Enterprise Optimization Audit),
 * so "momentum" is deliberately not shown as a number; the risk flags below
 * use only what's genuinely on the lead record (follow-up date, age, match
 * score).
 */
const STATUS_BASE: Record<string, number> = {
  new: 20,
  contacted: 40,
  qualified: 60,
};

function probability(lead: Lead): number {
  if (lead.status === "won") return 100;
  if (lead.status === "lost") return 0;
  const base = STATUS_BASE[lead.status] ?? 20;
  return Math.round(base * 0.6 + lead.score * 0.4);
}

function temperature(prob: number): { label: string; icon: typeof Flame; className: string } {
  if (prob >= 65) return { label: "Hot", icon: Flame, className: "bg-rose-100 text-rose-600" };
  if (prob >= 35) return { label: "Warm", icon: ThermometerSun, className: "bg-amber-100 text-amber-600" };
  return { label: "Cold", icon: Snowflake, className: "bg-sky-100 text-sky-600" };
}

function riskFlags(lead: Lead): string[] {
  const flags: string[] = [];
  const now = Date.now();
  const ageDays = (now - lead.createdAt) / (24 * 60 * 60 * 1000);
  if (lead.followUpAt && lead.followUpAt < now) flags.push("Follow-up overdue");
  if (lead.status === "new" && ageDays > 3) flags.push("No contact in 3+ days");
  if (lead.score < 50) flags.push("Low match confidence");
  return flags;
}

export function DealProbability() {
  const leads = useLeads();
  const open = leads.filter((l) => l.status !== "won" && l.status !== "lost");

  if (open.length === 0) {
    return (
      <Panel title="Deal probability radar">
        <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          <Radar className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
          {leads.length === 0
            ? "No leads captured yet — the radar fills in live as sessions convert to leads."
            : "No open opportunities right now — every captured lead is already won or lost."}
        </div>
      </Panel>
    );
  }

  const ranked = open
    .map((lead) => ({ lead, prob: probability(lead), flags: riskFlags(lead) }))
    .sort((a, b) => b.prob - a.prob);

  const currency = leads[0]?.currency ?? "USD";
  const riskAdjustedValue = ranked.reduce((sum, r) => sum + r.lead.price * (r.prob / 100), 0);
  const rawValue = ranked.reduce((sum, r) => sum + r.lead.price, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Open opportunities
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {open.length}
          </div>
          <div className="text-xs text-zinc-400">{formatMoney(rawValue, currency)} raw pipeline</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Risk-adjusted pipeline
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {formatMoney(riskAdjustedValue, currency)}
          </div>
          <div className="text-xs text-zinc-400">value × close probability, per deal</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Needs attention
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {ranked.filter((r) => r.flags.length > 0).length}
          </div>
          <div className="text-xs text-zinc-400">deals with a risk flag</div>
        </div>
      </div>

      <Panel title="Ranked by close probability">
        <div className="space-y-2">
          {ranked.map(({ lead, prob, flags }) => {
            const temp = temperature(prob);
            return (
              <div
                key={lead.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-full", temp.className)}>
                    <temp.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-medium text-zinc-900">{lead.name}</div>
                    <div className="text-xs text-zinc-400">
                      {lead.itemName} · {formatMoney(lead.price, lead.currency)}
                    </div>
                    {flags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {flags.map((f) => (
                          <span
                            key={f}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                          >
                            <AlertTriangle className="h-2.5 w-2.5" /> {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-0.5">
                  <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", temp.className)}>
                    {temp.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-900">{prob}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

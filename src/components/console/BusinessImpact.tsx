"use client";

import { DollarSign, Trophy, Sparkles, Target, Award } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useLeads } from "@/core/store/leads";
import { useUsers } from "@/core/data/users";
import { formatMoney } from "@/core/engine/explain";

/**
 * Business Impact Dashboard (roadmap P0). Executive-framed metrics —
 * revenue, win rate, rep performance — computed entirely from real leads
 * (core/store/leads.ts), the same source of truth AI Analytics already
 * uses. Deliberately omits "consultations completed", "decision time" and
 * "sales cycle reduction": none are derivable without a persisted session
 * history, which this pilot's browser-only storage doesn't have — shown
 * honestly as absent rather than invented. See the Enterprise Optimization
 * Audit for the full reasoning.
 */
export function BusinessImpact() {
  const leads = useLeads();
  const users = useUsers();

  if (leads.length === 0) {
    return (
      <Panel title="Business impact">
        <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          <DollarSign className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
          No leads captured yet — business impact fills in live as sessions
          convert to leads.
        </div>
      </Panel>
    );
  }

  const decided = leads.filter((l) => l.status === "won" || l.status === "lost");
  const won = leads.filter((l) => l.status === "won");
  const currency = leads[0]?.currency ?? "USD";

  const revenueInfluenced = leads.reduce((sum, l) => sum + l.price, 0);
  const revenueWon = won.reduce((sum, l) => sum + l.price, 0);
  const avgWonDealSize = won.length ? Math.round(revenueWon / won.length) : 0;
  const winRate = decided.length ? Math.round((won.length / decided.length) * 100) : null;

  const stats = [
    { icon: DollarSign, label: "Revenue influenced", value: formatMoney(revenueInfluenced, currency), caption: `across ${leads.length} recommendation${leads.length === 1 ? "" : "s"}` },
    { icon: Trophy, label: "Revenue won", value: formatMoney(revenueWon, currency), caption: `${won.length} deal${won.length === 1 ? "" : "s"} closed` },
    { icon: Target, label: "Win rate", value: winRate != null ? `${winRate}%` : "—", caption: decided.length ? `${won.length} of ${decided.length} decided` : "no decided leads yet" },
    { icon: Award, label: "Avg. won deal size", value: won.length ? formatMoney(avgWonDealSize, currency) : "—", caption: won.length ? "won leads only" : "no wins yet" },
  ];

  // Rep leaderboard — real, from Lead.assignedTo, resolved against the user directory.
  const repIds = Array.from(new Set(leads.map((l) => l.assignedTo).filter((id): id is string => !!id)));
  const leaderboard = repIds
    .map((id) => {
      const repLeads = leads.filter((l) => l.assignedTo === id);
      const repWon = repLeads.filter((l) => l.status === "won");
      return {
        id,
        name: users.find((u) => u.id === id)?.name ?? "Unknown",
        wonCount: repWon.length,
        wonValue: repWon.reduce((sum, l) => sum + l.price, 0),
        leadCount: repLeads.length,
      };
    })
    .sort((a, b) => b.wonValue - a.wonValue);

  // Revenue by industry pack — real, from Lead.packLabel.
  const packLabels = Array.from(new Set(leads.map((l) => l.packLabel)));
  const byPack = packLabels
    .map((label) => ({
      label,
      value: leads.filter((l) => l.packLabel === label).reduce((sum, l) => sum + l.price, 0),
      count: leads.filter((l) => l.packLabel === label).length,
    }))
    .sort((a, b) => b.value - a.value);
  const maxPackValue = Math.max(...byPack.map((p) => p.value), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              <s.icon className="h-3.5 w-3.5" /> {s.label}
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
              {s.value}
            </div>
            <div className="text-xs text-zinc-400">{s.caption}</div>
          </div>
        ))}
      </div>

      <Panel title="Revenue by industry">
        {byPack.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">No revenue captured yet.</p>
        ) : (
          <div className="space-y-3">
            {byPack.map((p) => (
              <div key={p.label} className="flex items-center gap-3">
                <div className="w-32 shrink-0 truncate text-sm text-zinc-600">{p.label}</div>
                <div className="h-7 flex-1 overflow-hidden rounded-lg bg-zinc-100">
                  <div
                    className="flex h-full items-center justify-end rounded-lg bg-zinc-900 pr-2 text-xs font-medium text-white"
                    style={{ width: `${Math.max(8, (p.value / maxPackValue) * 100)}%` }}
                  >
                    {formatMoney(p.value, currency)}
                  </div>
                </div>
                <div className="w-16 shrink-0 text-right text-xs text-zinc-400">
                  {p.count} lead{p.count === 1 ? "" : "s"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Top performing salespeople">
        {leaderboard.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            No leads assigned to a salesperson yet — assign leads from the
            Leads tab to populate this leaderboard.
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((r, i) => (
              <div
                key={r.id}
                className={cx(
                  "flex items-center justify-between rounded-xl border px-4 py-3",
                  i === 0 ? "border-amber-200 bg-amber-50" : "border-zinc-200 bg-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cx(
                      "grid h-7 w-7 place-items-center rounded-full text-xs font-semibold",
                      i === 0 ? "bg-amber-400 text-white" : "bg-zinc-100 text-zinc-500",
                    )}
                  >
                    {i === 0 ? <Sparkles className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-zinc-900">{r.name}</div>
                    <div className="text-xs text-zinc-400">
                      {r.wonCount} won of {r.leadCount} lead{r.leadCount === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-zinc-900">
                  {formatMoney(r.wonValue, currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

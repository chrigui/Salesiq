"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Panel, StatCard } from "@/components/console/light-ui";
import { useBuyerAggregate } from "@/core/store/buyerProfiles";

const INTENT_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very high",
  unclassified: "Unclassified",
};

/**
 * Wave 2 management aggregate view — the first real server-side
 * groupBy/count rollup in this codebase, scoped identically to the Buyers
 * list (a Salesperson's numbers here are their own branch/assignment,
 * never a tenant-wide figure they shouldn't see).
 */
export function BuyerOverview({ onOpenBuyer }: { onOpenBuyer: (id: string) => void }) {
  const { aggregate, isLoading } = useBuyerAggregate();

  if (isLoading || !aggregate) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  const highIntentCount = aggregate.intentCounts
    .filter((c) => c.level === "high" || c.level === "very_high")
    .reduce((sum, c) => sum + c.count, 0);
  const unresolvedObjectionTotal = aggregate.topObjectionKinds.reduce((sum, k) => sum + k.count, 0);

  const intentChartData = aggregate.intentCounts.map((c) => ({ label: INTENT_LABEL[c.level] ?? c.level, count: c.count }));
  const readinessChartData = aggregate.readinessCounts.map((c) => ({ label: c.stage, count: c.count }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total buyers" value={String(aggregate.totalBuyers)} caption="In your current view" />
        <StatCard label="High/very high intent" value={String(highIntentCount)} caption="Ready for a direct push" />
        <StatCard
          label="Unresolved objections"
          value={String(unresolvedObjectionTotal)}
          caption="Across top objection kinds"
        />
        <StatCard label="Segments" value={String(aggregate.segments.length)} caption="Saved buyer segments" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Intent distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={intentChartData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12, fontSize: 12 }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="count" fill="#18181b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Purchase readiness distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={readinessChartData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12, fontSize: 12 }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="count" fill="#18181b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Segments">
          {aggregate.segments.length === 0 ? (
            <p className="py-4 text-sm text-zinc-400">No segments saved yet.</p>
          ) : (
            <div className="space-y-2">
              {aggregate.segments.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2">
                  <span className="text-sm text-zinc-900">{s.name}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                    {s.buyerCount} buyer{s.buyerCount === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Needs attention">
          {aggregate.attention.length === 0 ? (
            <p className="py-4 text-sm text-zinc-400">No unresolved objections right now.</p>
          ) : (
            <div className="space-y-2">
              {aggregate.attention.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onOpenBuyer(a.id)}
                  className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{a.name || "Unnamed buyer"}</p>
                    <p className="text-xs text-zinc-400">
                      Unresolved {a.objectionKind.replace(/-/g, " ")} objection
                      {a.confidence && ` · ${a.confidence} confidence`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

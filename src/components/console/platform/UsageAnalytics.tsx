"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, StatCard, sparkBars } from "@/components/console/light-ui";
import { apiCallsTrend, platformUsage, usageByVertical } from "@/lib/analytics";

/**
 * Usage Analytics (Module 5 · Platform Admin). Platform-wide resource
 * consumption — API calls, storage, bandwidth, AI tokens — alongside the
 * existing per-vertical usage split. Same illustrative-but-realistic mock
 * data as the rest of the Platform Admin console.
 */
export function UsageAnalytics() {
  const trend = apiCallsTrend();
  const max = Math.max(...usageByVertical.map((u) => u.value));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {platformUsage.map((u, i) => (
          <StatCard key={u.label} {...u} unit="" bars={sparkBars(i + 17)} />
        ))}
      </div>

      <Panel title="API calls (14 days)">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend} margin={{ left: -20, right: 8 }}>
            <defs>
              <linearGradient id="apiCallsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#18181b" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              formatter={(v: number) => v.toLocaleString()}
              contentStyle={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12, fontSize: 12 }}
              cursor={{ stroke: "#e4e4e7" }}
            />
            <Area type="monotone" dataKey="calls" stroke="#18181b" strokeWidth={2} fill="url(#apiCallsFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Usage by vertical">
        <div className="space-y-3.5">
          {usageByVertical.map((u) => (
            <div key={u.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-zinc-600">{u.name}</span>
                <span className="text-zinc-400 tabular-nums">{u.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-900"
                  style={{ width: `${(u.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

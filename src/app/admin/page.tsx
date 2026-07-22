"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ConsoleShell, KpiCard, Panel } from "@/components/console/ConsoleShell";
import { cx } from "@/components/ui/primitives";
import {
  mrrTrend,
  platformKpis,
  tenants,
  usageByVertical,
} from "@/lib/analytics";

const AXIS = "rgb(113 113 122)";
const PIE = [
  "rgb(99 102 241)",
  "rgb(16 185 129)",
  "rgb(56 189 248)",
  "rgb(244 63 94)",
  "rgb(234 179 8)",
  "rgb(168 85 247)",
];
const tooltipStyle = {
  background: "rgba(24,24,27,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
};

const healthColor: Record<string, string> = {
  healthy: "text-emerald-400 bg-emerald-400/10",
  watch: "text-amber-400 bg-amber-400/10",
  "at-risk": "text-rose-400 bg-rose-400/10",
};

export default function AdminPage() {
  const mrr = mrrTrend();
  return (
    <ConsoleShell
      title="SalesIQ Platform"
      subtitle="Master Administration"
      glyph="◆"
      nav={[
        "Overview",
        "Tenants",
        "Subscriptions",
        "Billing",
        "Usage",
        "System health",
        "Audit logs",
        "White-label",
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {platformKpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="MRR growth (12 months)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mrr} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fill: AXIS, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "MRR"]}
              />
              <Area type="monotone" dataKey="mrr" stroke="rgb(99 102 241)" strokeWidth={2} fill="url(#mrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Usage by vertical">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={usageByVertical}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {usageByVertical.map((_, i) => (
                  <Cell key={i} fill={PIE[i % PIE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {usageByVertical.map((u, i) => (
              <div key={u.name} className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE[i % PIE.length] }} />
                {u.name}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Tenants" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="pb-3 font-medium">Organization</th>
                <th className="pb-3 font-medium">Vertical</th>
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 text-right font-medium">Seats</th>
                <th className="pb-3 text-right font-medium">Sessions</th>
                <th className="pb-3 text-right font-medium">MRR</th>
                <th className="pb-3 text-right font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.name} className="border-t border-white/5">
                  <td className="py-3 font-medium">{t.name}</td>
                  <td className="py-3 text-ink-muted">{t.vertical}</td>
                  <td className="py-3 text-ink-muted">{t.plan}</td>
                  <td className="py-3 text-right tabular-nums text-ink-muted">{t.seats}</td>
                  <td className="py-3 text-right tabular-nums text-ink-muted">
                    {t.sessions.toLocaleString()}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    ${t.mrr.toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={cx(
                        "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                        healthColor[t.health],
                      )}
                    >
                      {t.health}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </ConsoleShell>
  );
}

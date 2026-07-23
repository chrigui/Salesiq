"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ConsoleShell, KpiCard, Panel } from "@/components/console/ConsoleShell";
import { useLeads } from "@/core/store/leads";
import {
  companyKpis,
  funnel,
  popularProducts,
  popularQuestions,
  sessionTrend,
} from "@/lib/analytics";

const BRAND = "rgb(16 185 129)";
const AXIS = "rgb(113 113 122)";

const tooltipStyle = {
  background: "rgba(24,24,27,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
};

export default function DashboardPage() {
  const trend = sessionTrend();
  return (
    <ConsoleShell
      title="Green Hills Living"
      subtitle="Company Dashboard · Real Estate"
      glyph="◈"
      nav={[
        "Overview",
        "Inventory",
        "Questions",
        "Leads",
        "Analytics",
        "Branding",
        "Integrations",
        "Users",
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {companyKpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Sessions & conversions (30 days)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="sessions" stroke={BRAND} strokeWidth={2} fill="url(#s)" />
              <Area type="monotone" dataKey="conversions" stroke="rgb(52 211 153)" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Most-selected products">
          <div className="space-y-3">
            {popularProducts.map((p, i) => (
              <div key={p.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink-muted">{p.name}</span>
                  <span className="text-ink-faint">{p.selected}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-soft"
                    style={{
                      width: `${(p.selected / popularProducts[0].selected) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Sales funnel">
          <div className="space-y-2.5">
            {funnel.map((f, i) => (
              <div key={f.stage} className="flex items-center gap-3">
                <div className="w-44 shrink-0 text-sm text-ink-muted">
                  {f.stage}
                </div>
                <div className="h-8 flex-1 overflow-hidden rounded-lg bg-white/5">
                  <div
                    className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-brand/70 to-brand pr-2 text-xs font-medium text-white"
                    style={{ width: `${(f.value / funnel[0].value) * 100}%` }}
                  >
                    {f.value.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Question completion rate">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={popularQuestions} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="q" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="rate" fill={BRAND} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <RecentLeads />
    </ConsoleShell>
  );
}

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function RecentLeads() {
  const leads = useLeads();
  return (
    <Panel title="Recent leads" className="mt-4">
      {leads.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-faint">
          Leads captured from live sessions appear here in real time. Run a
          session and tap <span className="text-ink-muted">Save lead to CRM</span>{" "}
          in the companion.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Interested in</th>
                <th className="pb-3 font-medium">Vertical</th>
                <th className="pb-3 text-right font-medium">Value</th>
                <th className="pb-3 text-right font-medium">Match</th>
                <th className="pb-3 text-right font-medium">Captured</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => (
                <tr key={l.id} className="border-t border-white/5">
                  <td className="py-3 font-medium">
                    <span className="flex items-center gap-2">
                      {l.name}
                      {i === 0 && (
                        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          NEW
                        </span>
                      )}
                    </span>
                    {l.email && (
                      <span className="block text-xs text-ink-faint">{l.email}</span>
                    )}
                  </td>
                  <td className="py-3 text-ink-muted">{l.itemName}</td>
                  <td className="py-3 text-ink-muted">{l.packLabel}</td>
                  <td className="py-3 text-right tabular-nums">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: l.currency,
                      maximumFractionDigits: 0,
                    }).format(l.price)}
                  </td>
                  <td className="py-3 text-right font-semibold text-brand">
                    {l.score}
                  </td>
                  <td className="py-3 text-right text-ink-faint">
                    {timeAgo(l.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

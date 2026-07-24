"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardShell, type NavGroup } from "@/components/console/DashboardShell";
import { Panel, StatCard, sparkBars } from "@/components/console/light-ui";
import { WaffleChart } from "@/components/console/WaffleChart";
import { BuilderSection } from "@/components/console/builder/BuilderSection";
import { DEFAULT_PACK_ID } from "@/core/industries";
import { useLeads } from "@/core/store/leads";
import {
  companyKpis,
  funnel,
  popularProducts,
  popularQuestions,
} from "@/lib/analytics";

const NAV: NavGroup[] = [
  {
    heading: "Main Menu",
    items: [
      { id: "Overview", label: "Overview", icon: "LayoutDashboard" },
      { id: "Inventory", label: "Inventory", icon: "Package" },
      { id: "Questions", label: "Questions", icon: "ListChecks" },
      { id: "Scoring", label: "Scoring", icon: "Scale" },
      { id: "Branding", label: "Branding", icon: "Palette" },
    ],
  },
  {
    heading: "Insights",
    items: [
      { id: "Leads", label: "Leads", icon: "UserPlus" },
      { id: "Analytics", label: "Analytics", icon: "BarChart3" },
    ],
  },
  {
    heading: "Management",
    items: [
      { id: "Integrations", label: "Integrations", icon: "Plug" },
      { id: "Team", label: "Team", icon: "Users" },
      { id: "Settings", label: "Settings", icon: "Settings" },
    ],
  },
];

const KPI_UNITS = ["sessions", "", "", "leads"];

export default function DashboardPage() {
  const [tab, setTab] = useState<string>("Overview");
  const [builderPack, setBuilderPack] = useState<string>(DEFAULT_PACK_ID);

  return (
    <DashboardShell
      workspaceKind="Agency"
      workspaceName="Green Hills Living"
      glyph="◈"
      greeting="Welcome back, Sara"
      groups={NAV}
      active={tab}
      onSelect={setTab}
    >
      {tab === "Questions" ? (
        <BuilderSection kind="questions" packId={builderPack} onPackChange={setBuilderPack} />
      ) : tab === "Inventory" ? (
        <BuilderSection kind="inventory" packId={builderPack} onPackChange={setBuilderPack} />
      ) : tab === "Scoring" ? (
        <BuilderSection kind="rules" packId={builderPack} onPackChange={setBuilderPack} />
      ) : tab === "Branding" ? (
        <BuilderSection kind="branding" packId={builderPack} onPackChange={setBuilderPack} />
      ) : tab === "Leads" ? (
        <RecentLeads />
      ) : tab === "Analytics" ? (
        <Analytics />
      ) : tab === "Overview" ? (
        <Overview />
      ) : (
        <Placeholder tab={tab} />
      )}
    </DashboardShell>
  );
}

function Overview() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {companyKpis.map((k, i) => (
          <StatCard key={k.label} {...k} unit={KPI_UNITS[i]} bars={sparkBars(i + 3)} />
        ))}
      </div>

      <WaffleChart title="Sales Trend" />

      <div className="grid gap-4 lg:grid-cols-2">
        <MostSelected />
        <Completion />
      </div>

      <RecentLeads />
    </div>
  );
}

function Analytics() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {companyKpis.map((k, i) => (
          <StatCard key={k.label} {...k} unit={KPI_UNITS[i]} bars={sparkBars(i + 3)} />
        ))}
      </div>
      <WaffleChart title="Sessions & conversions" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Funnel />
        <Completion />
      </div>
    </div>
  );
}

function MostSelected() {
  return (
    <Panel title="Most-selected products">
      <div className="space-y-3.5">
        {popularProducts.map((p) => (
          <div key={p.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-zinc-600">{p.name}</span>
              <span className="text-zinc-400 tabular-nums">{p.selected}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900"
                style={{ width: `${(p.selected / popularProducts[0].selected) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Funnel() {
  return (
    <Panel title="Sales funnel">
      <div className="space-y-2.5">
        {funnel.map((f) => (
          <div key={f.stage} className="flex items-center gap-3">
            <div className="w-40 shrink-0 text-sm text-zinc-600">{f.stage}</div>
            <div className="h-8 flex-1 overflow-hidden rounded-lg bg-zinc-100">
              <div
                className="flex h-full items-center justify-end rounded-lg bg-zinc-900 pr-2 text-xs font-medium text-white"
                style={{ width: `${(f.value / funnel[0].value) * 100}%` }}
              >
                {f.value.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Completion() {
  return (
    <Panel title="Question completion rate">
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={popularQuestions} margin={{ left: -20, right: 8 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis dataKey="q" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: 12,
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Bar dataKey="rate" fill="#18181b" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function Placeholder({ tab }: { tab: string }) {
  return (
    <Panel title={tab}>
      <p className="py-8 text-center text-sm text-zinc-400">
        {tab} is configured per tenant via the pack config. This surface is part
        of the platform blueprint and not wired in the demo.
      </p>
    </Panel>
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
    <Panel title="Recent leads">
      {leads.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-400">
          Leads captured from live sessions appear here in real time. Run a
          session and tap{" "}
          <span className="text-zinc-600">Save lead to CRM</span> in the
          companion.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
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
                <tr key={l.id} className="border-t border-zinc-100">
                  <td className="py-3 font-medium text-zinc-900">
                    <span className="flex items-center gap-2">
                      {l.name}
                      {i === 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          NEW
                        </span>
                      )}
                    </span>
                    {l.email && (
                      <span className="block text-xs text-zinc-400">{l.email}</span>
                    )}
                  </td>
                  <td className="py-3 text-zinc-600">{l.itemName}</td>
                  <td className="py-3 text-zinc-600">{l.packLabel}</td>
                  <td className="py-3 text-right tabular-nums text-zinc-900">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: l.currency,
                      maximumFractionDigits: 0,
                    }).format(l.price)}
                  </td>
                  <td className="py-3 text-right font-semibold text-zinc-900">
                    {l.score}
                  </td>
                  <td className="py-3 text-right text-zinc-400">
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

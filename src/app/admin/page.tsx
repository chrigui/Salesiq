"use client";

import { useState } from "react";
import { DashboardShell, type NavGroup } from "@/components/console/DashboardShell";
import { Panel, StatCard, sparkBars } from "@/components/console/light-ui";
import { WaffleChart } from "@/components/console/WaffleChart";
import { cx } from "@/components/ui/primitives";
import { platformKpis, tenants, usageByVertical } from "@/lib/analytics";

const NAV: NavGroup[] = [
  {
    heading: "Main Menu",
    items: [
      { id: "Overview", label: "Overview", icon: "LayoutDashboard" },
      { id: "Tenants", label: "Tenants", icon: "Building2" },
      { id: "Subscriptions", label: "Subscriptions", icon: "CreditCard" },
      { id: "Billing", label: "Billing", icon: "Receipt" },
    ],
  },
  {
    heading: "Insights",
    items: [
      { id: "Usage", label: "Usage", icon: "PieChart" },
      { id: "System health", label: "System health", icon: "Activity" },
    ],
  },
  {
    heading: "Management",
    items: [
      { id: "Audit logs", label: "Audit logs", icon: "ScrollText" },
      { id: "White-label", label: "White-label", icon: "Palette" },
      { id: "Settings", label: "Settings", icon: "Settings" },
    ],
  },
];

const KPI_UNITS = ["", "", "tenants", ""];

const healthColor: Record<string, string> = {
  healthy: "text-emerald-600 bg-emerald-100",
  watch: "text-amber-600 bg-amber-100",
  "at-risk": "text-rose-600 bg-rose-100",
};

export default function AdminPage() {
  const [tab, setTab] = useState<string>("Overview");

  return (
    <DashboardShell
      workspaceKind="Platform"
      workspaceName="SalesIQ Platform"
      glyph="◆"
      greeting="Platform overview"
      groups={NAV}
      active={tab}
      onSelect={setTab}
    >
      {tab === "Tenants" ? (
        <TenantsTable />
      ) : tab === "Usage" ? (
        <Usage />
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
        {platformKpis.map((k, i) => (
          <StatCard key={k.label} {...k} unit={KPI_UNITS[i]} bars={sparkBars(i + 11)} />
        ))}
      </div>

      <WaffleChart title="Revenue trend" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TenantsTable />
        </div>
        <Usage />
      </div>
    </div>
  );
}

function TenantsTable() {
  return (
    <Panel title="Tenants">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
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
              <tr key={t.name} className="border-t border-zinc-100">
                <td className="py-3 font-medium text-zinc-900">{t.name}</td>
                <td className="py-3 text-zinc-600">{t.vertical}</td>
                <td className="py-3 text-zinc-600">{t.plan}</td>
                <td className="py-3 text-right tabular-nums text-zinc-600">{t.seats}</td>
                <td className="py-3 text-right tabular-nums text-zinc-600">
                  {t.sessions.toLocaleString()}
                </td>
                <td className="py-3 text-right tabular-nums text-zinc-900">
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
  );
}

function Usage() {
  const max = Math.max(...usageByVertical.map((u) => u.value));
  return (
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
  );
}

function Placeholder({ tab }: { tab: string }) {
  return (
    <Panel title={tab}>
      <p className="py-8 text-center text-sm text-zinc-400">
        {tab} is part of the platform blueprint and not wired in the demo.
      </p>
    </Panel>
  );
}

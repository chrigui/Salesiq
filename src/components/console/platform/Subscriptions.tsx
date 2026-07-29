"use client";

import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import {
  PLATFORM_PLANS,
  updateTenantPlan,
  usePlatformTenants,
  type PlatformPlan,
} from "@/core/data/platformTenants";

const PLAN_STYLE: Record<PlatformPlan, string> = {
  Starter: "bg-zinc-100 text-zinc-600",
  Growth: "bg-sky-100 text-sky-700",
  Enterprise: "bg-violet-100 text-violet-700",
};

/**
 * Subscriptions (Module 5 · Platform Admin). Per-tenant plan management —
 * a real change, not cosmetic: switching a tenant's plan here recomputes
 * their MRR, updates the Tenants table and Billing Center everywhere they
 * read the same tenant store, and writes an audit-log entry.
 */
export function Subscriptions() {
  const tenants = usePlatformTenants();
  const distribution = PLATFORM_PLANS.map((plan) => ({
    plan,
    count: tenants.filter((t) => t.plan === plan).length,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {distribution.map((d) => (
          <div key={d.plan} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium", PLAN_STYLE[d.plan])}>
                {d.plan}
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
              {d.count}
            </div>
            <div className="text-xs text-zinc-400">tenant{d.count === 1 ? "" : "s"}</div>
          </div>
        ))}
      </div>

      <Panel title="Tenant plans">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="pb-3 font-medium">Organization</th>
                <th className="pb-3 font-medium">Vertical</th>
                <th className="pb-3 text-right font-medium">Seats</th>
                <th className="pb-3 text-right font-medium">MRR</th>
                <th className="pb-3 text-right font-medium">Plan</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t border-zinc-100">
                  <td className="py-3 font-medium text-zinc-900">{t.name}</td>
                  <td className="py-3 text-zinc-600">{t.vertical}</td>
                  <td className="py-3 text-right tabular-nums text-zinc-600">{t.seats}</td>
                  <td className="py-3 text-right tabular-nums text-zinc-900">
                    ${t.mrr.toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    <select
                      value={t.plan}
                      onChange={(e) => updateTenantPlan(t.id, e.target.value as PlatformPlan)}
                      className={cx(
                        "rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none",
                        PLAN_STYLE[t.plan],
                      )}
                    >
                      {PLATFORM_PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

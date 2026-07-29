"use client";

import { cx } from "@/components/ui/primitives";
import { useSystemHealth, type SystemMetric } from "@/core/data/systemHealth";

const STATUS_STYLE: Record<SystemMetric["status"], string> = {
  healthy: "bg-emerald-100 text-emerald-700",
  watch: "bg-amber-100 text-amber-700",
  critical: "bg-rose-100 text-rose-700",
};

const STATUS_DOT: Record<SystemMetric["status"], string> = {
  healthy: "bg-emerald-500",
  watch: "bg-amber-500",
  critical: "bg-rose-500",
};

function Sparkline({ history, status }: { history: number[]; status: SystemMetric["status"] }) {
  const max = Math.max(...history, 1);
  const min = Math.min(...history, 0);
  const range = max - min || 1;
  const points = history
    .map((v, i) => `${(i / (history.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(" ");
  const stroke = status === "critical" ? "#f43f5e" : status === "watch" ? "#f59e0b" : "#18181b";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-10 w-full">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={3} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * System Monitoring (Module 5). No real multi-tenant infrastructure sits
 * behind this pilot, so these metrics are simulated — a live-ticking
 * random walk around a realistic baseline, same illustrative spirit as the
 * rest of the Platform Admin console's tenant/revenue figures. Thresholds
 * still drive real status logic, so the panel behaves like a genuine
 * monitoring dashboard would.
 */
export function SystemMonitoring() {
  const metrics = useSystemHealth();
  const overall = metrics.some((m) => m.status === "critical")
    ? "critical"
    : metrics.some((m) => m.status === "watch")
      ? "watch"
      : "healthy";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4">
        <span className={cx("h-2.5 w-2.5 rounded-full", STATUS_DOT[overall])} />
        <span className="text-sm font-medium text-zinc-900">
          {overall === "healthy" ? "All systems operational" : overall === "watch" ? "Degraded performance" : "Active incident"}
        </span>
        <span className="ml-auto text-xs text-zinc-400">Updates every 2.5s</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                {m.label}
              </span>
              <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", STATUS_STYLE[m.status])}>
                {m.status}
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
              {m.value}
              <span className="ml-1 text-sm font-normal text-zinc-400">{m.unit}</span>
            </div>
            <Sparkline history={m.history} status={m.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

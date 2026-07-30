"use client";

import { Flame, Loader2 } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useLeadsState } from "@/core/store/leads";

const WEEKS = 6;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function intensityClass(value: number, max: number): string {
  if (value === 0) return "bg-zinc-50 text-zinc-300";
  const ratio = value / max;
  if (ratio > 0.85) return "bg-zinc-900 text-white";
  if (ratio > 0.65) return "bg-zinc-700 text-white";
  if (ratio > 0.45) return "bg-zinc-500 text-white";
  if (ratio > 0.25) return "bg-zinc-300 text-zinc-800";
  return "bg-zinc-100 text-zinc-500";
}

/**
 * Product interest heatmap (Module 8). Real lead volume per item, bucketed
 * by the week each lead was captured — computed live from
 * core/store/leads.ts, not a seeded mock. With a young pilot this will look
 * sparse; that's the real shape of the data, not a bug.
 */
export function ProductHeatmap() {
  const { leads, isLoading } = useLeadsState();

  if (isLoading) {
    return (
      <Panel title="Product interest heatmap">
        <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-zinc-300" />
          Loading…
        </div>
      </Panel>
    );
  }

  if (leads.length === 0) {
    return (
      <Panel title="Product interest heatmap">
        <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          <Flame className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
          No leads captured yet — product interest fills in live as sessions
          convert to leads.
        </div>
      </Panel>
    );
  }

  const now = Date.now();
  const columnLabels = Array.from({ length: WEEKS }, (_, i) =>
    i === WEEKS - 1 ? "This week" : `${WEEKS - 1 - i}w ago`,
  );

  const itemNames = Array.from(new Set(leads.map((l) => l.itemName))).sort(
    (a, b) => leads.filter((l) => l.itemName === b).length - leads.filter((l) => l.itemName === a).length,
  );

  const rows = itemNames.slice(0, 8).map((name) => {
    const values = Array.from({ length: WEEKS }, () => 0);
    for (const lead of leads) {
      if (lead.itemName !== name) continue;
      const weeksAgo = Math.floor((now - lead.createdAt) / MS_PER_WEEK);
      const col = WEEKS - 1 - weeksAgo;
      if (col >= 0 && col < WEEKS) values[col]++;
    }
    return { name, values };
  });
  const max = Math.max(...rows.flatMap((r) => r.values), 1);

  return (
    <Panel title="Product interest heatmap">
      <p className="mb-4 text-sm text-zinc-500">
        Leads captured per item, by week — the real, current shape of
        interest, not a simulated trend.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="w-32 pb-2 text-left font-medium text-zinc-400">Product</th>
              {columnLabels.map((w) => (
                <th key={w} className="pb-2 text-center font-medium text-zinc-400">
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="py-1 pr-3 font-medium text-zinc-900">{row.name}</td>
                {row.values.map((v, i) => (
                  <td key={i} className="p-1">
                    <div
                      className={cx(
                        "grid h-9 place-items-center rounded-lg tabular-nums transition",
                        intensityClass(v, max),
                      )}
                      title={`${row.name} · ${columnLabels[i]} · ${v} lead${v === 1 ? "" : "s"}`}
                    >
                      {v > 0 ? v : ""}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

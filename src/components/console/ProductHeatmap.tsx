"use client";

import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { productHeatmap } from "@/lib/analytics";

function intensityClass(value: number, max: number): string {
  const ratio = value / max;
  if (ratio > 0.85) return "bg-zinc-900 text-white";
  if (ratio > 0.65) return "bg-zinc-700 text-white";
  if (ratio > 0.45) return "bg-zinc-500 text-white";
  if (ratio > 0.25) return "bg-zinc-300 text-zinc-800";
  return "bg-zinc-100 text-zinc-500";
}

/** Heatmaps (Module 8) — which products get the most interest, by week. */
export function ProductHeatmap() {
  const { weeks, rows } = productHeatmap();
  const max = Math.max(...rows.flatMap((r) => r.values));

  return (
    <Panel title="Product interest heatmap">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="w-32 pb-2 text-left font-medium text-zinc-400">Product</th>
              {weeks.map((w) => (
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
                      title={`${row.name} · ${weeks[i]} · ${v} selections`}
                    >
                      {v}
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

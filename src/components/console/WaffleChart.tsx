"use client";

import { useState } from "react";
import { Info, MoreHorizontal } from "lucide-react";
import { cx } from "@/components/ui/primitives";
import { Card, SegmentedControl, spaced } from "./light-ui";
import { salesSeries, type SalesPeriod } from "@/lib/analytics";

const PERIODS: readonly SalesPeriod[] = ["Weekly", "Monthly", "Yearly"];
const ROWS = 18;

/**
 * The dot-matrix "sales trend" chart from the reference — each column is a
 * vertical stack of small squares (new users in black over existing users in
 * grey) against a faint full grid. Hover a column for the breakdown.
 */
export function WaffleChart({
  title = "Sales Trend",
  seriesFor = salesSeries,
}: {
  title?: string;
  seriesFor?: (p: SalesPeriod) => ReturnType<typeof salesSeries>;
}) {
  const [period, setPeriod] = useState<SalesPeriod>("Monthly");
  const series = seriesFor(period);
  const cellUnit = series.ceiling / ROWS;
  const yLabels = Array.from({ length: 7 }, (_, i) => (6 - i) * (series.ceiling / 6));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          {title}
          <Info className="h-3.5 w-3.5" />
        </div>
        <button className="grid h-7 w-7 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-zinc-400">Total Revenue :</span>
            <span className="text-xl font-bold tracking-tight text-zinc-900 tabular-nums">
              ${spaced(series.total.toLocaleString("en-US"))}
            </span>
          </div>
          <div className="hidden items-center gap-4 text-[11px] uppercase tracking-wide text-zinc-500 sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-900" />
              New User
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
              Existing User
            </span>
          </div>
        </div>
        <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {/* Chart */}
      <div className="mt-5 flex gap-3">
        {/* y-axis */}
        <div
          className="flex flex-col justify-between py-0.5 text-right text-[10px] tabular-nums text-zinc-400"
          style={{ height: ROWS * 12 - 3 }}
        >
          {yLabels.map((v) => (
            <span key={v}>{Math.round(v / 1000)}k</span>
          ))}
        </div>

        {/* grid — scrolls horizontally on small screens, spreads on desktop */}
        <div className="min-w-0 flex-1 overflow-x-auto pb-1 lg:overflow-visible">
          <div className="flex min-w-[560px] items-end justify-between gap-2">
            {series.groups.map((group) => (
              <div key={group.label} className="flex flex-col items-center gap-2">
                <div className="flex gap-[3px]">
                  {group.columns.map((col, ci) => {
                    const newC = Math.round(col.newUsers / cellUnit);
                    const exC = Math.round(col.existingUsers / cellUnit);
                    return (
                      <div key={ci} className="group/col relative flex flex-col-reverse gap-[3px]">
                        {Array.from({ length: ROWS }, (_, r) => {
                          const kind =
                            r < newC
                              ? "new"
                              : r < newC + exC
                                ? "existing"
                                : "empty";
                          return (
                            <span
                              key={r}
                              className={cx(
                                "h-[9px] w-[9px] rounded-[2px]",
                                kind === "new"
                                  ? "bg-zinc-900"
                                  : kind === "existing"
                                    ? "bg-zinc-400"
                                    : "bg-zinc-100",
                              )}
                            />
                          );
                        })}

                        {/* tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left shadow-lg group-hover/col:block">
                          <div className="mb-1 text-xs font-medium text-zinc-900">
                            {group.label}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <span className="h-2 w-2 rounded-full bg-zinc-900" />
                            New User{" "}
                            <span className="font-semibold text-zinc-900">
                              {Math.round(col.newUsers / 1000)}k
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <span className="h-2 w-2 rounded-full bg-zinc-400" />
                            Existing User{" "}
                            <span className="font-semibold text-zinc-900">
                              {Math.round(col.existingUsers / 1000)}k
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10px] tracking-wide text-zinc-400">
                  {group.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

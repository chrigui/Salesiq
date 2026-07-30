"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cx } from "@/components/ui/primitives";

/** Style commas with surrounding thin spaces, e.g. "20,320" -> "20 , 320". */
export function spaced(value: string): string {
  return value.replace(/,/g, " , ");
}

/** White surface card with a hairline border — the console's building block. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-zinc-200 bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Panel({
  title,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      {(title || right) && (
        <div className="flex items-center justify-between px-5 pt-5">
          {typeof title === "string" ? (
            <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          ) : (
            title
          )}
          {right}
        </div>
      )}
      <div className={cx("p-5", bodyClassName)}>{children}</div>
    </Card>
  );
}

/** Mini equaliser sparkline shown in the corner of a stat card. */
function Sparkline({ bars }: { bars: number[] }) {
  const max = Math.max(...bars, 1);
  return (
    <div className="flex h-9 items-end gap-[3px]">
      {bars.map((b, i) => (
        <span
          key={i}
          className={cx(
            "w-[3px] rounded-full",
            i >= bars.length - 2 ? "bg-zinc-900" : "bg-zinc-200",
          )}
          style={{ height: `${Math.max(12, (b / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  /** Omit both when there's no real prior-period figure to compare against —
   * a fabricated trend arrow is worse than no trend at all. */
  delta?: string;
  up?: boolean;
  /** A short factual caption shown in place of the trend row, e.g. "12 open leads". */
  caption?: string;
  bars?: number[];
}

export function StatCard({ label, value, unit, delta, up, caption, bars }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </div>
        {bars && <Sparkline bars={bars} />}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[28px] font-bold leading-none tracking-tight text-zinc-900 tabular-nums">
          {spaced(value)}
        </span>
        {unit && <span className="text-sm text-zinc-400">{unit}</span>}
      </div>
      {delta != null && up != null ? (
        <div className="mt-4 flex items-center gap-1.5 border-t border-zinc-100 pt-3">
          <span
            className={cx(
              "grid h-4 w-4 place-items-center rounded-full",
              up ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600",
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
          </span>
          <span
            className={cx(
              "text-xs font-medium",
              up ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {delta}
          </span>
          <span className="text-xs text-zinc-400">vs last year</span>
        </div>
      ) : caption ? (
        <div className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
          {caption}
        </div>
      ) : null}
    </Card>
  );
}

/** Deterministic little bar set for a stat card's sparkline. */
export function sparkBars(seed: number, n = 12): number[] {
  let s = seed;
  return Array.from({ length: n }, () => {
    s = (s * 9301 + 49297) % 233280;
    return 20 + (s / 233280) * 80;
  });
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-zinc-100 p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cx(
            "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
            opt === value
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

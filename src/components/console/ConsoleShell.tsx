"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cx } from "@/components/ui/primitives";

/** Shared chrome for the admin-style consoles (Company + Platform). */
export function ConsoleShell({
  title,
  subtitle,
  glyph,
  nav,
  active,
  onSelect,
  children,
}: {
  title: string;
  subtitle: string;
  glyph: string;
  nav: string[];
  /** When provided, the nav is controlled and this item is highlighted. */
  active?: string;
  onSelect?: (item: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-aurora min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/20 text-xl text-brand ring-1 ring-brand/30">
              {glyph}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-ink-faint">{subtitle}</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-ink-muted transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> All products
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {nav.map((n, i) => {
            const isActive = active != null ? n === active : i === 0;
            return (
              <button
                key={n}
                onClick={() => onSelect?.(n)}
                className={cx(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  isActive
                    ? "bg-white/10 text-ink"
                    : "text-ink-faint hover:bg-white/5 hover:text-ink-muted",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="text-sm text-ink-faint">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      <div
        className={cx(
          "mt-1 text-sm font-medium",
          up ? "text-emerald-400" : "text-rose-400",
        )}
      >
        {delta}
      </div>
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("glass rounded-3xl p-5", className)}>
      <h3 className="mb-4 text-sm font-semibold text-ink-muted">{title}</h3>
      {children}
    </div>
  );
}

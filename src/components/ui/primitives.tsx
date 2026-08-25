"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

export { cx };

/**
 * Frosted-glass card — the platform's signature surface. Radius/shadow read
 * the brand token CSS vars (see BrandTokenScope) with today's exact
 * hardcoded values as the fallback, so this renders identically until a
 * subtree is actually brand-scoped.
 */
export function GlassCard({
  className,
  strong,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return (
    <div
      className={cx(strong ? "glass-strong" : "glass", className)}
      style={{
        borderRadius: "var(--radius, 1.5rem)",
        boxShadow: "var(--shadow-color, 0 25px 50px -12px rgb(0 0 0 / 0.4))",
        ...style,
      }}
      {...props}
    />
  );
}

type ButtonVariant = "brand" | "ghost" | "outline";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    active?: boolean;
  }
>(function Button(
  { className, variant = "ghost", active, style, ...props },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60";
  const variants: Record<ButtonVariant, string> = {
    // btn-primary is a stable hook for BrandTokenScope's data-button-style
    // CSS overrides (see globals.css) — purely a scoping class, no styling
    // of its own.
    brand:
      "btn-primary bg-brand text-white shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:brightness-110",
    ghost: cx(
      "text-ink-muted hover:text-ink hover:bg-white/5",
      active && "bg-white/10 text-ink",
    ),
    outline: cx(
      "border border-white/10 text-ink hover:bg-white/5",
      active && "border-brand/60 bg-brand/10 text-ink",
    ),
  };
  return (
    <button
      ref={ref}
      className={cx(base, variants[variant], className)}
      // Radius reads the brand token CSS var (see BrandTokenScope) with
      // today's exact hardcoded rounded-2xl as the fallback.
      style={{ borderRadius: "var(--radius-sm, 1rem)", ...style }}
      {...props}
    />
  );
});

/** Small uppercase eyebrow label. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
      {children}
    </span>
  );
}

/** Gradient tokens used for inventory imagery in the demo. */
export const GRADIENTS: Record<string, string> = {
  emerald: "from-emerald-400/30 via-teal-500/20 to-cyan-500/10",
  sky: "from-sky-400/30 via-blue-500/20 to-indigo-500/10",
  amber: "from-amber-400/30 via-orange-500/20 to-rose-500/10",
  violet: "from-violet-400/30 via-purple-500/20 to-fuchsia-500/10",
  rose: "from-rose-400/30 via-pink-500/20 to-red-500/10",
};

export function itemGradient(token: string): string {
  return GRADIENTS[token] ?? GRADIENTS.violet;
}

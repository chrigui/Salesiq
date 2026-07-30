"use client";

import { cn } from "@/lib/utils";

/**
 * The audit docs' own hero texture (docs/overview.html .hero::before/::after),
 * ported as a reusable layer: a masked dotted grid plus a soft accent glow in
 * the upper right. `animate-drift` gives it a slow, near-subliminal parallax;
 * Tailwind's `motion-reduce:animate-none` turns that off for users who've
 * asked for less motion — the texture itself still renders, just static.
 */
export function DottedBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div
        className="absolute inset-[-20px] bg-dotted-texture bg-dotted opacity-90 motion-safe:animate-drift motion-reduce:animate-none"
        style={{
          maskImage: "radial-gradient(120% 90% at 82% -10%, #000 0%, transparent 62%)",
          WebkitMaskImage: "radial-gradient(120% 90% at 82% -10%, #000 0%, transparent 62%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(70% 60% at 88% -20%, var(--accent-wash), transparent 60%)",
        }}
      />
    </div>
  );
}

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Matches docs/*.html's .chip / .tag patterns exactly (pill radius, 1px
// line border, mono uppercase for the "tag" variant).
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium",
  {
    variants: {
      variant: {
        chip: "border-line bg-surface px-3 py-1.5 text-[13px] text-ink",
        accent: "border-accent-wash bg-accent-wash px-3 py-1.5 text-[13px] text-accent-ink",
        tag: "border-transparent bg-pending-wash px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-pending-ink",
        live: "border-transparent bg-good-wash px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-accent-ink",
      },
    },
    defaultVariants: { variant: "chip" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };

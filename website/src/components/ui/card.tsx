import * as React from "react";
import { cn } from "@/lib/utils";

// Matches docs/*.html's .card pattern: surface bg, 1px line border,
// 16px radius, the one reusable elevation shadow token.
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-2xl border border-line bg-surface p-6 shadow-card", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export { Card };

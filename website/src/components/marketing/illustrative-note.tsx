import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The honesty-labeling primitive for this site: any stat, logo row, or
 * testimonial that isn't backed by a published, real customer result gets
 * one of these underneath it. SalesIQ has no named enterprise customers
 * yet — this component is how that stays true everywhere social proof
 * appears, on this page and every later one, without quietly becoming
 * false the moment someone copies a homepage section onto a new page.
 */
export function IllustrativeNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mt-3 flex items-center gap-1.5 text-xs text-ink-muted", className)}>
      <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

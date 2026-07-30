"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function FeatureCard({
  icon,
  title,
  description,
  live,
  className,
}: {
  /** A rendered icon element (e.g. `<Compass className="h-5 w-5" />`), not
   * a component reference — component references (functions) can't cross
   * the server/client boundary when this card's parent is a Server
   * Component, but a already-rendered element can. */
  icon: React.ReactNode;
  title: string;
  description: string;
  live?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-line bg-surface p-6 shadow-card transition-colors",
        live && "border-accent-wash",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-wash text-accent-ink">
          {icon}
        </span>
        {live && <Badge variant="live">Live today</Badge>}
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="text-[14.5px] leading-relaxed text-ink-muted">{description}</p>
    </motion.div>
  );
}

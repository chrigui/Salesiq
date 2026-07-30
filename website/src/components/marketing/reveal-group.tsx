"use client";

import { motion } from "framer-motion";
import { staggerChildren, revealOnScroll } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Wraps a grid of children (e.g. FeatureCards using the `fadeUp` variant)
 * so they animate in as a staggered group on scroll, instead of each card
 * needing its own whileInView wiring.
 */
export function RevealGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div {...revealOnScroll} variants={staggerChildren} className={cn(className)}>
      {children}
    </motion.div>
  );
}

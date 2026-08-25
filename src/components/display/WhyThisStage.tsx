"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { InventoryItem } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { ItemImage } from "@/components/ui/ItemImage";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/**
 * The customer-facing simplification of a recommendation — spec section 8:
 * never a raw weighted score, just the plain-English reasons scoreInventory
 * already produces. Salesperson-facing Strong/Good/Moderate scoring lives
 * only in the Companion's DecisionBreakdown, never here.
 */
export function WhyThisStage({ item, entry }: { item: InventoryItem; entry: ScoredItem | undefined }) {
  const reasons = entry?.reasons.slice(0, 5) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center"
    >
      <ItemImage image={item.image} photo={item.photo} rounded="rounded-[2rem]" className="h-72 w-full lg:h-96" />
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand/15 px-4 py-1.5 text-xs font-medium text-brand ring-1 ring-brand/30">
          <Sparkles className="h-3.5 w-3.5" />
          Why this one
        </div>
        <h2 className="text-4xl font-semibold tracking-tight">{item.name}</h2>
        <p className="mt-3 text-lg text-ink-muted">
          Based on what you told us, this property is the strongest overall fit.
        </p>
        {reasons.length > 0 && (
          <ul className="mt-6 space-y-3">
            {reasons.map((r, i) => (
              <li key={i} className="glass flex items-start gap-3 rounded-2xl px-5 py-4 text-base">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

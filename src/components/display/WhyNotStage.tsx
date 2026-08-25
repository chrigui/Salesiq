"use client";

import { motion } from "framer-motion";
import type { Answers, InventoryItem, IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { whyNotReasons } from "@/core/engine/whyNot";
import { ItemImage } from "@/components/ui/ItemImage";
import { formatMoney } from "@/core/engine/explain";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/**
 * Spec section 6: "using the existing Why-Not functionality" — calls the
 * same generic, pairwise whyNotReasons() the Comparison Experience already
 * uses, never a re-derived explanation. The winner is whichever item in the
 * active comparison group currently scores highest (matching
 * ComparisonExperience's own winner derivation so the two never disagree),
 * falling back to the pack's global top pick when there's no active group.
 */
export function WhyNotStage({
  item,
  candidate,
  winner,
  pack,
  answers,
}: {
  item: InventoryItem;
  candidate: ScoredItem | undefined;
  winner: ScoredItem | undefined;
  pack: IndustryPack;
  answers: Answers;
}) {
  const reasons = candidate && winner && candidate.item.id !== winner.item.id
    ? whyNotReasons(pack, answers, candidate, winner)
    : [];

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
        <h2 className="text-4xl font-semibold tracking-tight">{item.name}</h2>
        <p className="mt-2 text-lg text-ink-muted">{formatMoney(item.price, item.currency)}</p>
        {winner && winner.item.id !== item.id && (
          <p className="mt-3 text-base text-ink-faint">
            A strong option — here&rsquo;s how it compares to {winner.item.name}.
          </p>
        )}
        {reasons.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {reasons.map((r, i) => (
              <li key={i} className="glass flex items-start gap-3 rounded-2xl px-5 py-4 text-base">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink-faint" />
                {r}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-base text-ink-faint">Matched fewer of your priorities than the top pick.</p>
        )}
      </div>
    </motion.div>
  );
}

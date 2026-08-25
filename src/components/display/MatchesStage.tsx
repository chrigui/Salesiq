"use client";

import { motion } from "framer-motion";
import type { ScoredItem } from "@/core/engine/scoring";
import type { IndustryPack } from "@/core/types";
import { formatMoney } from "@/core/engine/explain";
import { ItemImage } from "@/components/ui/ItemImage";
import { deriveAvailabilityLabel } from "@/lib/availability";
import { readPropertyAttributes } from "@/components/companion/explore/attributeDisplay";
import { cx } from "@/components/ui/primitives";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/** Prioritize 3-6 strongest matches (spec section 9) — the salesperson can
 * always reveal more from their own PropertyExplorer grid; the Display
 * itself never crowds the customer with the full inventory. */
const MAX_CARDS = 6;

/**
 * Spec section 9: a neutral top-picks grid — large cards, no "winner"
 * framing (unlike "compare"'s auto-top-3-with-why-behind-winner). The
 * salesperson picks one from here to push into the PROPERTY hero.
 */
export function MatchesStage({ pack, scored }: { pack: IndustryPack; scored: ScoredItem[] }) {
  const top = scored.slice(0, MAX_CARDS);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="w-full max-w-6xl"
    >
      <h2 className="mb-8 text-center text-4xl font-semibold tracking-tight">Your best matches</h2>
      <div
        className={cx(
          "grid gap-6",
          top.length <= 2 ? "md:grid-cols-2" : top.length <= 4 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-3",
        )}
      >
        {top.map((s, i) => {
          const attrs = readPropertyAttributes(pack, s.item);
          const availability = deriveAvailabilityLabel(s.item);
          return (
            <motion.div
              key={s.item.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, ...spring }}
              className="glass overflow-hidden rounded-3xl"
            >
              <ItemImage image={s.item.image} photo={s.item.photo} className="h-40">
                <div className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/40 text-sm font-bold text-white backdrop-blur">
                  {s.score}%
                </div>
              </ItemImage>
              <div className="p-5">
                <h3 className="text-xl font-semibold">{s.item.name}</h3>
                <p className="text-sm text-ink-faint">{s.item.location?.label ?? s.item.subtitle}</p>
                <p className="mt-2 text-lg font-semibold">{formatMoney(s.item.price, s.item.currency)}</p>
                <div className="mt-1 text-xs text-ink-faint">
                  {[
                    attrs.bedrooms !== null ? `${attrs.bedrooms} bed` : null,
                    attrs.bathrooms !== null ? `${attrs.bathrooms} bath` : null,
                    (attrs.areaSqm ?? attrs.plotSize) !== null
                      ? `${attrs.areaSqm ?? attrs.plotSize} m²`
                      : null,
                    availability,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

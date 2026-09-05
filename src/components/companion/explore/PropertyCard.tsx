"use client";

import { Bed, Bath, Maximize, MapPin, Star } from "lucide-react";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { narrate, formatMoney } from "@/core/engine/explain";
import { ItemImage } from "@/components/ui/ItemImage";
import { cx } from "@/components/ui/primitives";
import { deriveAvailabilityLabel } from "@/lib/availability";
import { readPropertyAttributes } from "./attributeDisplay";

/**
 * The large, tappable visual card every results grid renders — image,
 * name, location, bed/bath/type/area where the pack actually tracks them,
 * price, availability, up to 3 real highlights, the real match score, and
 * a single honest match-reason line. Never invents a field a pack/item
 * doesn't carry. Kept in parity with the Display's own MatchCard
 * (MatchesStage.tsx) so the salesperson and customer are looking at the
 * same facts, just laid out for their different screens.
 */
export function PropertyCard({
  pack,
  scored,
  onSelect,
}: {
  pack: IndustryPack;
  scored: ScoredItem;
  onSelect: () => void;
}) {
  const { item, score, reasons } = scored;
  const attrs = readPropertyAttributes(pack, item);
  const availability = deriveAvailabilityLabel(item);
  const reason = reasons[0] ?? narrate(scored, pack);

  return (
    <button
      onClick={onSelect}
      className="glass-strong flex w-full flex-col overflow-hidden rounded-[1.6rem] text-left ring-1 ring-white/10 transition hover:ring-white/20 active:scale-[0.99]"
    >
      <ItemImage image={item.image} photo={item.photo} className="h-40 w-full">
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          <Star className="h-3 w-3 fill-current text-amber-300" />
          {score}% MATCH
        </div>
      </ItemImage>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <div className="text-sm font-semibold text-ink">{item.name}</div>
          {item.location?.label && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
              <MapPin className="h-3 w-3" />
              {item.location.label}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold text-brand">{formatMoney(item.price, item.currency)}</div>
          {availability && (
            <span
              className={cx(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                availability === "Available"
                  ? "bg-emerald-400/15 text-emerald-400"
                  : "bg-rose-400/15 text-rose-400",
              )}
            >
              {availability}
            </span>
          )}
        </div>

        {(attrs.propertyType || attrs.bedrooms !== null || attrs.bathrooms !== null || attrs.areaSqm !== null || attrs.plotSize !== null) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            {attrs.propertyType && <span>{attrs.propertyType}</span>}
            {attrs.bedrooms !== null && (
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {attrs.bedrooms}
              </span>
            )}
            {attrs.bathrooms !== null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                {attrs.bathrooms}
              </span>
            )}
            {(attrs.areaSqm ?? attrs.plotSize) !== null && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                {attrs.areaSqm ?? attrs.plotSize} m²
              </span>
            )}
          </div>
        )}

        {item.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.highlights.slice(0, 3).map((h) => (
              <span
                key={h}
                className={cx(
                  "rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-ink-faint ring-1 ring-white/10",
                )}
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {reason && <p className="mt-auto pt-1 text-xs italic text-ink-faint">&ldquo;{reason}&rdquo;</p>}
      </div>
    </button>
  );
}

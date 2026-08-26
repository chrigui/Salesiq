"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Trophy } from "lucide-react";
import { ItemImage } from "@/components/ui/ItemImage";
import { formatMoney } from "@/core/engine/explain";
import { getBasePack } from "@/core/industries";
import { RecapPropertyDetails } from "./RecapPropertyDetails";
import { RecapFavoriteButton } from "./RecapFavoriteButton";
import { trackRecapEvent } from "./trackRecapEvent";
import type { PublicRecapShortlistItem } from "@/lib/recaps/resolve";
import type { ScoredItem } from "@/core/engine/scoring";

/**
 * Spec section 19's "YOUR BEST MATCH" — the same frozen score/reasons the
 * meeting ended on, never re-run. Takes packId (not the resolved pack
 * object — IndustryPack carries real scoring-rule functions that can't
 * cross the server/client boundary) and re-resolves it client-side via
 * getBasePack, the same plain client-importable module the Companion/
 * Display already use.
 */
export function RecapBestMatch({
  entry,
  packId,
  scored,
  showPayment,
  showInvestment,
  code,
  favorited,
}: {
  entry: PublicRecapShortlistItem;
  packId: string;
  scored: ScoredItem[];
  showPayment: boolean;
  showInvestment: boolean;
  code: string;
  favorited: boolean;
}) {
  const pack = getBasePack(packId);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-strong overflow-hidden rounded-[1.8rem] ring-1 ring-brand/30">
      <ItemImage image={entry.item.image} photo={entry.item.photo} className="h-56 w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-brand/90 px-3 py-1 text-xs font-semibold text-white">
          <Trophy className="h-3.5 w-3.5" /> Your best match
        </div>
        <div className="absolute right-4 top-4">
          <RecapFavoriteButton code={code} itemId={entry.item.id} initialFavorited={favorited} />
        </div>
        <div className="absolute bottom-4 left-5 right-5">
          <div className="text-xl font-semibold text-white">{entry.item.name}</div>
          {entry.currentAvailability && <div className="text-xs text-white/70">{entry.currentAvailability}</div>}
        </div>
      </ItemImage>

      <div className="p-5">
        <div className="mb-1 text-2xl font-semibold text-brand">{formatMoney(entry.item.price, entry.currency)}</div>
        <div className="mb-3 text-xs text-ink-faint">{entry.score}% match with what you told us</div>

        {entry.reasons.length > 0 && (
          <div className="mb-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Why it fits
            </div>
            <ul className="space-y-1.5">
              {entry.reasons.slice(0, 5).map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => {
            const next = !expanded;
            setExpanded(next);
            if (next) trackRecapEvent(code, "PropertyView", entry.item.id);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand/15 py-3 text-sm font-semibold text-brand transition hover:bg-brand/20"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" /> Hide details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> Explore this property
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-4">
            <RecapPropertyDetails
              pack={pack}
              item={entry.item}
              scored={scored}
              showPayment={showPayment}
              showInvestment={showInvestment}
              code={code}
            />
          </div>
        )}
      </div>
    </div>
  );
}

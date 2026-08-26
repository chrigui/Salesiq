"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { ItemImage } from "@/components/ui/ItemImage";
import { formatMoney } from "@/core/engine/explain";
import { getBasePack } from "@/core/industries";
import { RecapPropertyDetails } from "./RecapPropertyDetails";
import type { PublicRecapShortlistItem } from "@/lib/recaps/resolve";
import type { ScoredItem } from "@/core/engine/scoring";

/**
 * One shortlisted property, collapsed by default (large image, name, price,
 * live availability, "why it stood out" — the exact reasons frozen from the
 * meeting, never re-derived) with a tap-to-expand into the full progressive-
 * disclosure detail set. Mobile-first: full-width card, large tap target.
 * Takes packId (not the resolved pack object — see RecapBestMatch's note on
 * why IndustryPack can't cross the server/client boundary) and re-resolves
 * it client-side via getBasePack.
 */
export function RecapPropertyCard({
  entry,
  packId,
  scored,
  showPayment,
  showInvestment,
  highlight,
}: {
  entry: PublicRecapShortlistItem;
  packId: string;
  scored: ScoredItem[];
  showPayment: boolean;
  showInvestment: boolean;
  highlight?: boolean;
}) {
  const pack = getBasePack(packId);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-3xl border ${highlight ? "border-brand/40 ring-1 ring-brand/30" : "border-white/10"} bg-white/[0.02]`}
    >
      <ItemImage image={entry.item.image} photo={entry.item.photo} className="h-48 w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <div className="text-lg font-semibold text-white">{entry.item.name}</div>
            {entry.currentAvailability && (
              <div className="text-xs text-white/70">{entry.currentAvailability}</div>
            )}
          </div>
          <div className="rounded-full bg-brand/90 px-2.5 py-1 text-xs font-semibold text-white">
            {entry.score}% match
          </div>
        </div>
      </ItemImage>

      <div className="p-4">
        <div className="mb-3 text-lg font-semibold text-brand">{formatMoney(entry.item.price, entry.currency)}</div>

        {entry.reasons.length > 0 && (
          <div className="mb-3">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Why it stood out
            </div>
            <ul className="space-y-1">
              {entry.reasons.slice(0, 5).map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                  <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Hide details
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> View details
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-3">
            <RecapPropertyDetails
              pack={pack}
              item={entry.item}
              scored={scored}
              showPayment={showPayment}
              showInvestment={showInvestment}
            />
          </div>
        )}
      </div>
    </div>
  );
}

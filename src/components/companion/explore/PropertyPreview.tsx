"use client";

import { ChevronLeft, MapPin, Bed, Bath, Ruler, Star, Bookmark, BookmarkCheck, ScreenShare, ListTree } from "lucide-react";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { useSession } from "@/core/store/session";
import { logBuyerActivity } from "@/core/store/buyerProfiles";
import { narrate, formatMoney } from "@/core/engine/explain";
import { ItemImage } from "@/components/ui/ItemImage";
import { readPropertyAttributes } from "./attributeDisplay";

/**
 * The focused single-property view opened by tapping a card — real score,
 * real reasons, real attributes only. [SHOW CUSTOMER] reuses the existing
 * session.focusItem mechanism (already pushes the item to the paired
 * Customer Display); [ADD TO SHORTLIST] reuses the existing bookmarks
 * array, not a new one.
 */
export function PropertyPreview({
  pack,
  scored,
  onBack,
  onMoreDetails,
}: {
  pack: IndustryPack;
  scored: ScoredItem;
  onBack: () => void;
  /** Omitted until the full Property Details screen ships — no dead button in the meantime. */
  onMoreDetails?: () => void;
}) {
  const session = useSession();
  const { item, score, reasons } = scored;
  const attrs = readPropertyAttributes(pack, item);
  const whyItFits = reasons.length > 0 ? reasons.slice(0, 5) : [narrate(scored, pack)];
  const shortlisted = session.bookmarks.includes(item.id);

  const showCustomer = () => {
    session.focusItem(item.id);
  };

  const toggleShortlist = () => {
    const adding = !shortlisted;
    session.toggleBookmark(item.id);
    if (adding && session.buyerProfileId) {
      void logBuyerActivity(session.buyerProfileId, { kind: "item_saved", packId: pack.id, itemId: item.id });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-aurora">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-6">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <ItemImage image={item.image} photo={item.photo} className="h-56 w-full rounded-[1.6rem]">
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
            {score}% MATCH
          </div>
        </ItemImage>

        <div className="mt-4">
          <h1 className="text-xl font-semibold text-ink">{item.name}</h1>
          {item.location?.label && (
            <div className="mt-1 flex items-center gap-1 text-sm text-ink-faint">
              <MapPin className="h-3.5 w-3.5" />
              {item.location.label}
            </div>
          )}
          <div className="mt-2 text-2xl font-semibold text-brand">{formatMoney(item.price, item.currency)}</div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-muted">
            {attrs.propertyType && <span>{attrs.propertyType}</span>}
            {attrs.bedrooms !== null && (
              <span className="flex items-center gap-1.5">
                <Bed className="h-4 w-4" />
                {attrs.bedrooms} bed{attrs.bedrooms === 1 ? "" : "s"}
              </span>
            )}
            {attrs.bathrooms !== null && (
              <span className="flex items-center gap-1.5">
                <Bath className="h-4 w-4" />
                {attrs.bathrooms} bath{attrs.bathrooms === 1 ? "" : "s"}
              </span>
            )}
            {(attrs.areaSqm ?? attrs.plotSize) !== null && (
              <span className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4" />
                {attrs.areaSqm ?? attrs.plotSize} m²
              </span>
            )}
          </div>

          {item.highlights.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.highlights.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-ink-faint ring-1 ring-white/10"
                >
                  {h}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Why it fits
            </div>
            <ul className="space-y-1.5">
              {whyItFits.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={showCustomer}
              className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-110"
            >
              <ScreenShare className="h-3.5 w-3.5" />
              Show customer
            </button>
            <button
              onClick={toggleShortlist}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
            >
              {shortlisted ? <BookmarkCheck className="h-3.5 w-3.5 text-brand" /> : <Bookmark className="h-3.5 w-3.5" />}
              {shortlisted ? "In shortlist" : "Add to shortlist"}
            </button>
            {onMoreDetails && (
              <button
                onClick={onMoreDetails}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
              >
                <ListTree className="h-3.5 w-3.5" />
                More details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

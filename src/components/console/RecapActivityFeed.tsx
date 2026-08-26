"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { getBasePack } from "@/core/industries";
import { useBuyerActivity, type BuyerActivityEvent } from "@/core/store/buyerProfiles";
import { isRecapActivityKind } from "@/lib/recaps/signals";
import { RecapEngagementBadge } from "./RecapEngagementBadge";

function itemName(packId: string | null, itemId: string | null): string | null {
  if (!packId || !itemId) return null;
  try {
    return getBasePack(packId).inventory.find((i) => i.id === itemId)?.name ?? null;
  } catch {
    return null;
  }
}

/** A friendly, per-event narration of the same recap_* kinds the generic Buyer Timeline shows as a raw "recap floor plan viewed" — this panel resolves the real item name and phrases each line the way a salesperson would say it out loud. */
function describe(event: BuyerActivityEvent): string {
  const name = itemName(event.packId, event.itemId);
  switch (event.kind) {
    case "recap_opened":
      return "Opened the recap";
    case "recap_property_viewed":
      return name ? `Viewed ${name} in detail` : "Viewed a property in detail";
    case "recap_gallery_viewed":
      return name ? `Browsed photos of ${name}` : "Browsed the photo gallery";
    case "recap_floor_plan_viewed":
      return name ? `Viewed the floor plan for ${name}` : "Viewed a floor plan";
    case "recap_payment_viewed":
      return name ? `Viewed the payment plan for ${name}` : "Viewed a payment plan";
    case "recap_investment_viewed":
      return name ? `Viewed investment details for ${name}` : "Viewed investment details";
    case "recap_comparison_viewed":
      return "Reviewed the comparison";
    case "recap_favorited":
      return name ? `Favorited ${name}` : "Favorited a property";
    case "recap_unfavorited":
      return name ? `Removed ${name} from favorites` : "Removed a favorite";
    case "recap_contact_clicked":
      return "Tapped to contact you";
    case "recap_share_clicked":
      return "Shared the recap";
    case "recap_qr_scanned":
      return "Scanned the recap QR code";
    case "recap_link_opened":
      return "Opened the recap link";
    default:
      return event.kind.replace(/_/g, " ");
  }
}

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

/**
 * Spec's salesperson-facing engagement feed — "Ahmed opened your recap.
 * Viewed: Property B..." — built entirely from real BuyerActivityEvent rows
 * PR13's logBuyerActivity already writes for any Recap linked to this
 * buyer. Deliberately a dedicated panel rather than a change to the
 * generic BuyerTimeline: the timeline's fallback label
 * (kind.replace(/_/g," ")) has no item-name resolution and isn't meant to
 * carry this much recap-specific narration.
 */
export function RecapActivityFeed({ buyerProfileId }: { buyerProfileId: string }) {
  const { events, isLoading } = useBuyerActivity(buyerProfileId);
  const recapEvents = events.filter((e) => isRecapActivityKind(e.kind));

  return (
    <Panel
      title={
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900">Recap activity</h3>
        </div>
      }
      right={<RecapEngagementBadge kinds={recapEvents.map((e) => e.kind)} />}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : recapEvents.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Nothing yet — once this buyer opens their LUMMA Recap, every view, favorite, and tap will appear here.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {recapEvents.map((event) => (
            <li key={event.id} className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-zinc-700">{describe(event)}</p>
              <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(event.createdAt)}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

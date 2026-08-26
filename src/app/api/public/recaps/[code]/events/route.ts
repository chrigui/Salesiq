import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { resolvePublicRecap } from "@/lib/recaps/resolve";
import { buildViewedSnapshot } from "@/lib/recaps/diff";
import { logBuyerActivity } from "@/lib/buyerProfiles/logActivity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECAP_EVENT_KINDS = [
  "View",
  "PropertyView",
  "GalleryView",
  "FloorPlanView",
  "PaymentView",
  "InvestmentView",
  "ComparisonView",
  "Favorite",
  "Unfavorite",
  "ContactClick",
  "ShareClick",
  "QrScan",
  "LinkOpen",
] as const;

/** Every RecapEvent kind's equivalent BuyerActivityEvent kind — only written when the Recap is linked to a real BuyerProfile. */
const RECAP_EVENT_TO_BUYER_ACTIVITY: Record<(typeof RECAP_EVENT_KINDS)[number], string> = {
  View: "recap_opened",
  PropertyView: "recap_property_viewed",
  GalleryView: "recap_gallery_viewed",
  FloorPlanView: "recap_floor_plan_viewed",
  PaymentView: "recap_payment_viewed",
  InvestmentView: "recap_investment_viewed",
  ComparisonView: "recap_comparison_viewed",
  Favorite: "recap_favorited",
  Unfavorite: "recap_unfavorited",
  ContactClick: "recap_contact_clicked",
  ShareClick: "recap_share_clicked",
  QrScan: "recap_qr_scanned",
  LinkOpen: "recap_link_opened",
};

const eventSchema = z.object({
  kind: z.enum(RECAP_EVENT_KINDS),
  itemId: z.string().max(200).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Public, unauthenticated, sendBeacon-friendly — same pattern as
 * /api/public/shared-experiences/[code]/events. resolvePublicRecap already
 * returns null uniformly for a missing/expired/archived code, so a stranger
 * probing codes here learns nothing new. A "View" event is also the sole
 * writer of Recap.lastViewedSnapshot (see src/lib/recaps/diff.ts) — the
 * baseline every future visit's "since your last visit" diff is computed
 * against. When the Recap is linked to a real BuyerProfile, the same event
 * also flows through logBuyerActivity so Buyer Intelligence's activity feed
 * and intent/readiness recompute stay consistent regardless of whether the
 * activity came from the salesperson's Companion or the customer's own
 * open of their Recap.
 */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const resolved = await resolvePublicRecap(code);
  if (!resolved) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }
  const { kind, meta } = parsed.data;
  const itemId =
    parsed.data.itemId && resolved.pack.inventory.some((i) => i.id === parsed.data.itemId)
      ? parsed.data.itemId
      : undefined;

  await prisma.recapEvent.create({
    data: {
      recapId: resolved.id,
      tenantId: resolved.tenantId,
      kind,
      itemId,
      meta: meta as Prisma.InputJsonValue | undefined,
    },
  });

  if (kind === "View") {
    await prisma.recap.update({
      where: { id: resolved.id },
      data: { lastViewedSnapshot: buildViewedSnapshot(resolved) as unknown as Prisma.InputJsonValue },
    });
  }

  if (resolved.buyerProfileId) {
    await logBuyerActivity({
      buyerProfileId: resolved.buyerProfileId,
      tenantId: resolved.tenantId,
      kind: RECAP_EVENT_TO_BUYER_ACTIVITY[kind],
      packId: resolved.packId,
      itemId,
      meta,
    });
  }

  return NextResponse.json({ ok: true });
}

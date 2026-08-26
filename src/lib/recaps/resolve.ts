import "server-only";
import { prisma } from "@/lib/db";
import { getBasePack } from "@/core/industries";
import { deriveAvailabilityLabel } from "@/lib/availability";
import { toCustomerSafeItem, toCustomerSafeCustomerName } from "@/lib/customerSafe";
import type { IndustryPack, InventoryItem } from "@/core/types";
import type { RecapComparedProperties, RecapShortlistedProperty } from "./types";
import type { RecapViewedSnapshot } from "./diff";
import { deriveFavoriteItemIds } from "./favorites";

/**
 * Every column this resolver is allowed to touch — deliberately an
 * explicit Prisma `select` rather than fetching the full row and omitting
 * fields after the fact, so `privateNotes` never exists in memory here at
 * all. This is the ONLY place a public surface (the /r/[code] page, PR9,
 * and the public events route, PR13) is allowed to read a Recap row from.
 */
const PUBLIC_RECAP_SELECT = {
  id: true,
  tenantId: true,
  code: true,
  status: true,
  packId: true,
  buyerProfileId: true,
  customerNameSnapshot: true,
  customerStory: true,
  requirementsSnapshot: true,
  shortlistedProperties: true,
  comparedProperties: true,
  finalRecommendationItemId: true,
  salespersonMessage: true,
  nextSteps: true,
  sectionVisibility: true,
  brandProfileId: true,
  brandSnapshot: true,
  lastViewedSnapshot: true,
  expiresAt: true,
  publishedAt: true,
  createdAt: true,
} as const;

export interface PublicRecapShortlistItem {
  item: InventoryItem;
  order: number;
  score: number;
  reasons: string[];
  priceAtCreation: number;
  currency: string;
  availabilityAtCreation: string | null;
  /** Re-derived from the live pack on every resolve — never frozen. */
  currentAvailability: string | null;
}

export interface PublicRecapComparedProperties {
  items: InventoryItem[];
  differences: string[];
}

/**
 * The shape every customer-facing Recap surface reads from — resolved live
 * against the shipped pack for price/availability/images (only ids, order,
 * reasons and authored text are frozen from creation time). Structurally
 * mirrors resolvePublicSharedExperience's "freeze ids/text, re-resolve
 * inventory live" pattern. `privateNotes` has no field here at all — not
 * merely omitted at render time, but never selected off the database row.
 */
export interface PublicRecapDTO {
  id: string;
  code: string;
  status: string;
  tenantId: string;
  buyerProfileId: string | null;
  packId: string;
  pack: IndustryPack;
  customerName: string;
  customerStory: Record<string, unknown>;
  requirementsSnapshot: Record<string, unknown>;
  shortlistedProperties: PublicRecapShortlistItem[];
  comparedProperties: PublicRecapComparedProperties | null;
  finalRecommendation: PublicRecapShortlistItem | null;
  salespersonMessage: Record<string, unknown> | null;
  nextSteps: string[] | null;
  sectionVisibility: Record<string, string>;
  brandProfileId: string | null;
  brandSnapshot: Record<string, unknown> | null;
  /** What the customer's last real view looked like — null until a "View" event has ever recorded one (see PR13's public events route, the only writer). */
  lastViewedSnapshot: RecapViewedSnapshot | null;
  expiresAt: number | null;
  publishedAt: number | null;
  createdAt: number;
}

/**
 * Resolves a LUMMA Recap by its public code. Returns null uniformly for a
 * missing code, an archived recap, or one past its expiresAt — a stranger
 * probing codes learns nothing about which case applies. Item detail
 * (price/availability/photos) is always read fresh from
 * getBasePack(packId).inventory; an itemId no longer present in the
 * shipped pack is silently dropped rather than shown as a broken card,
 * same discipline as resolvePublicSharedExperience.
 */
export async function resolvePublicRecap(code: string): Promise<PublicRecapDTO | null> {
  const row = await prisma.recap.findUnique({ where: { code }, select: PUBLIC_RECAP_SELECT });
  if (!row) return null;
  if (row.status === "Archived") return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

  const pack = getBasePack(row.packId);
  const byItemId = new Map(pack.inventory.map((i) => [i.id, i]));

  const snapshotShortlist = (row.shortlistedProperties as unknown as RecapShortlistedProperty[]) ?? [];
  const shortlistedProperties: PublicRecapShortlistItem[] = snapshotShortlist
    .map((s) => {
      const item = byItemId.get(s.itemId);
      if (!item) return null;
      const resolved: PublicRecapShortlistItem = {
        item: toCustomerSafeItem(item),
        order: s.order,
        score: s.score,
        reasons: s.reasons,
        priceAtCreation: s.priceAtCreation,
        currency: s.currency,
        availabilityAtCreation: s.availabilityAtCreation,
        currentAvailability: deriveAvailabilityLabel(item),
      };
      return resolved;
    })
    .filter((s): s is PublicRecapShortlistItem => Boolean(s))
    .sort((a, b) => a.order - b.order);

  const comparedSnapshot = row.comparedProperties as unknown as RecapComparedProperties | null;
  const comparedProperties: PublicRecapComparedProperties | null = comparedSnapshot
    ? {
        differences: comparedSnapshot.differences,
        items: comparedSnapshot.itemIds
          .map((id) => byItemId.get(id))
          .filter((i): i is InventoryItem => Boolean(i))
          .map(toCustomerSafeItem),
      }
    : null;

  const finalRecommendation = row.finalRecommendationItemId
    ? (shortlistedProperties.find((s) => s.item.id === row.finalRecommendationItemId) ?? null)
    : null;

  return {
    id: row.id,
    code: row.code,
    status: row.status,
    tenantId: row.tenantId,
    buyerProfileId: row.buyerProfileId,
    packId: row.packId,
    pack,
    customerName: toCustomerSafeCustomerName({ name: row.customerNameSnapshot ?? "" }),
    customerStory: (row.customerStory as Record<string, unknown>) ?? {},
    requirementsSnapshot: (row.requirementsSnapshot as Record<string, unknown>) ?? {},
    shortlistedProperties,
    comparedProperties,
    finalRecommendation,
    salespersonMessage: (row.salespersonMessage as Record<string, unknown> | null) ?? null,
    nextSteps: (row.nextSteps as unknown as string[] | null) ?? null,
    sectionVisibility: (row.sectionVisibility as Record<string, string>) ?? {},
    brandProfileId: row.brandProfileId,
    brandSnapshot: (row.brandSnapshot as Record<string, unknown> | null) ?? null,
    lastViewedSnapshot: (row.lastViewedSnapshot as unknown as RecapViewedSnapshot | null) ?? null,
    expiresAt: row.expiresAt?.getTime() ?? null,
    publishedAt: row.publishedAt?.getTime() ?? null,
    createdAt: row.createdAt.getTime(),
  };
}

/**
 * Reads a Recap's current customer-favorited item ids — a separate query
 * from resolvePublicRecap (which stays a pure, event-log-free read) since
 * this reduces the append-only Favorite/Unfavorite RecapEvent log rather
 * than any column on Recap itself. Used to seed each property card's
 * initial favorited state on page load.
 */
export async function getRecapFavoriteItemIds(recapId: string): Promise<string[]> {
  const events = await prisma.recapEvent.findMany({
    where: { recapId, kind: { in: ["Favorite", "Unfavorite"] } },
    select: { kind: true, itemId: true, createdAt: true },
  });
  return deriveFavoriteItemIds(
    events.map((e) => ({
      kind: e.kind as "Favorite" | "Unfavorite",
      itemId: e.itemId,
      createdAt: e.createdAt.getTime(),
    })),
  );
}

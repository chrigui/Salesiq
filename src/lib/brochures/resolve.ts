import "server-only";
import { prisma } from "@/lib/db";
import { getBasePack } from "@/core/industries";
import type { IndustryPack, InventoryItem } from "@/core/types";
import { toBrochureDTO, type BrochureDTO } from "@/lib/serializers/brochure";

export interface ResolvedBrochure {
  brochure: BrochureDTO;
  brochureId: string;
  tenantId: string;
  pack: IndustryPack;
  item: InventoryItem;
  /** Up to 3 nearest other items in the same pack, by price/type/area proximity — real inventory data, no invented market comps. */
  comparables: InventoryItem[];
  assets: { id: string; name: string; mimeType: string; sizeBytes: number }[];
}

/**
 * Resolves a brochure by its public slug, live against the shipped pack
 * config — never a stored copy of the listing. This is what makes "listing
 * edits reflect on the microsite instantly" true: there is nothing here to
 * go stale between edits and the next request.
 *
 * By default only a `Published` brochure resolves. Pass `previewTenantId`
 * (the *authenticated* caller's own tenant id — the microsite page checks
 * this via a real session + the `brochures.manage` capability before ever
 * calling with it) to also allow that tenant to preview their own
 * Draft/Archived brochure — never any other tenant's.
 *
 * Note: tenant-level customisations made via the Inventory Builder are
 * localStorage-only today (core/store/packs.ts — the PackDraft table they're
 * meant to land in isn't wired to any route yet), so this can only resolve
 * against the *shipped* pack config, not an admin's local edits. That's a
 * pre-existing gap in the platform, not one this route introduces — once
 * PackDraft is wired server-side, this function benefits for free.
 */
export async function resolvePublicBrochure(
  slug: string,
  opts?: { previewTenantId?: string },
): Promise<ResolvedBrochure | null> {
  const row = await prisma.brochure.findUnique({ where: { slug } });
  if (!row) return null;
  const isOwnPreview = opts?.previewTenantId && opts.previewTenantId === row.tenantId;
  if (row.status !== "Published" && !isOwnPreview) return null;

  const pack = getBasePack(row.packId);
  const item = pack.inventory.find((i) => i.id === row.itemId);
  if (!item) return null;

  const comparables = nearestComparables(pack.inventory, item);
  const assets = await prisma.brochureAsset.findMany({
    where: { brochureId: row.id },
    select: { id: true, name: true, mimeType: true, sizeBytes: true },
  });

  return {
    brochure: toBrochureDTO(row),
    brochureId: row.id,
    tenantId: row.tenantId,
    pack,
    item,
    comparables,
    assets,
  };
}

/** Nearest 3 other items in the same pack by price distance, preferring matching property-type attributes when present. */
function nearestComparables(inventory: InventoryItem[], item: InventoryItem, limit = 3): InventoryItem[] {
  const sameTypeKeys = Object.keys(item.attributes).filter(
    (k) => typeof item.attributes[k] === "boolean" && item.attributes[k] === true,
  );
  return inventory
    .filter((i) => i.id !== item.id)
    .map((i) => {
      const priceDelta = Math.abs(i.price - item.price) / Math.max(item.price, 1);
      const typeMismatch = sameTypeKeys.some((k) => i.attributes[k] !== true) ? 1 : 0;
      return { item: i, distance: priceDelta + typeMismatch };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((x) => x.item);
}

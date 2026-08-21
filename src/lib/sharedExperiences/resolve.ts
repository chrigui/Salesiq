import "server-only";
import { prisma } from "@/lib/db";
import { getBasePack } from "@/core/industries";
import type { IndustryPack, InventoryItem } from "@/core/types";
import { toSharedExperienceDTO, type SharedExperienceDTO } from "@/lib/serializers/sharedExperience";

export interface ResolvedSharedExperience {
  sharedExperience: SharedExperienceDTO;
  sharedExperienceId: string;
  tenantId: string;
  pack: IndustryPack;
  /** Real items from the live pack for every itemId in the snapshot — an id that no longer exists in the shipped pack is silently dropped rather than shown as a broken card. */
  items: InventoryItem[];
  focusedItem: InventoryItem | null;
}

/**
 * Resolves a shared experience by its public code, live against the shipped
 * pack config for item details (name/price/photo) — only the snapshot's
 * itemIds/proposal/customerName are frozen at share time. An expired link
 * resolves to null, same as a missing one — no distinction leaked to a
 * stranger probing codes.
 */
export async function resolvePublicSharedExperience(code: string): Promise<ResolvedSharedExperience | null> {
  const row = await prisma.sharedExperience.findUnique({ where: { code } });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

  const pack = getBasePack(row.packId);
  const dto = toSharedExperienceDTO(row);
  const items = dto.itemIds
    .map((id) => pack.inventory.find((i) => i.id === id))
    .filter((i): i is InventoryItem => Boolean(i));
  const focusedItem = dto.focusedItemId ? (pack.inventory.find((i) => i.id === dto.focusedItemId) ?? null) : null;

  return {
    sharedExperience: dto,
    sharedExperienceId: row.id,
    tenantId: row.tenantId,
    pack,
    items,
    focusedItem,
  };
}

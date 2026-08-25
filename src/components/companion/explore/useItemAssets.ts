"use client";

import { useEffect, useState } from "react";

export interface ItemAsset {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
}

/**
 * The real, admin-uploaded documents (floor plans, payment plans, extra
 * photos) for one inventory item — a single shared fetch against the same
 * authenticated endpoint InventoryBuilder's admin panel uses
 * (GET /api/inventory-items/[packId]/[itemId]/assets), so PropertyDetails
 * and ComparisonExperience never issue two independent copies of this
 * request or risk drifting on error/empty handling.
 */
export function useItemAssets(packId: string, itemId: string): { assets: ItemAsset[]; loading: boolean } {
  const [assets, setAssets] = useState<ItemAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/inventory-items/${packId}/${itemId}/assets`)
      .then((res) => (res.ok ? res.json() : { assets: [] }))
      .then((data) => {
        if (!cancelled) setAssets(data.assets ?? []);
      })
      .catch(() => {
        if (!cancelled) setAssets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [packId, itemId]);

  return { assets, loading };
}

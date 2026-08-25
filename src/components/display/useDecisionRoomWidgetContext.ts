"use client";

import { useEffect, useState } from "react";
import type { IndustryPack, InventoryItem } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import type { DisplayPackSummary, DisplayWidgetContext } from "./types";
import { resolveMotionConfig } from "@/core/display/motionPresets";
import { nearestComparables } from "@/lib/comparables";
import { narrate } from "@/core/engine/explain";

/**
 * Assembles a real DisplayWidgetContext for an arbitrary shortlisted item —
 * no saved DisplayProfile required. This is what lets the Decision Room's
 * cinematic modes (Investment/Lifestyle/Floor Plan/Location/Payment) reuse
 * Display Studio's existing widget library for *any* property, not just
 * ones an admin happened to publish a profile for. Assets come from the
 * public list route (the Display can be an unauthenticated kiosk), never
 * the capability-gated one PropertyDetails.tsx uses.
 */
export function useDecisionRoomWidgetContext(
  pack: IndustryPack,
  item: InventoryItem,
  scored: ScoredItem[],
): DisplayWidgetContext {
  const [assets, setAssets] = useState<DisplayWidgetContext["assets"]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/inventory-items/${pack.id}/${item.id}/assets`)
      .then((res) => (res.ok ? res.json() : { assets: [] }))
      .then((data) => {
        if (!cancelled) setAssets(data.assets ?? []);
      })
      .catch(() => {
        if (!cancelled) setAssets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pack.id, item.id]);

  const packSummary: DisplayPackSummary = {
    id: pack.id,
    label: pack.label,
    vertical: pack.vertical,
    currency: item.currency,
    branding: {
      name: pack.branding.name,
      tagline: pack.branding.tagline,
      brand: pack.branding.brand,
      brandSoft: pack.branding.brandSoft,
      logoGlyph: pack.branding.logoGlyph,
    },
  };

  const entry = scored.find((s) => s.item.id === item.id);

  return {
    item,
    pack: packSummary,
    template: "Detailed",
    mode: "presentation",
    assets,
    assetsBaseUrl: `/api/public/inventory-items/${pack.id}/${item.id}/assets`,
    motion: resolveMotionConfig(undefined),
    comparables: nearestComparables(pack.inventory, item),
    matchScore: entry ? { score: entry.score, reasons: entry.reasons, narrative: narrate(entry, pack) } : null,
  };
}

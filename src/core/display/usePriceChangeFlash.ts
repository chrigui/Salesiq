"use client";

import { useEffect, useRef, useState } from "react";

const FLASH_DURATION_MS = 4000;

// Module-scoped (not per-component instance): the goal is to remember what
// price this browser last showed for a given item anywhere on the live
// Display during this session, not the render history of one card.
const lastSeenPrices = new Map<string, number>();

/**
 * A real, reactive "Price updated" flash (spec section 29) — fires only
 * when useLivePack's already-live inventory delivers an actual price
 * change for this exact item id during this session, never a fabricated
 * or timed animation. The first time an id is seen it just records the
 * price silently (no flash on initial mount/page load).
 */
export function usePriceChangeFlash(itemId: string, price: number): boolean {
  const [flashing, setFlashing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const previous = lastSeenPrices.get(itemId);
    if (previous !== undefined && previous !== price) {
      setFlashing(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setFlashing(false), FLASH_DURATION_MS);
    }
    lastSeenPrices.set(itemId, price);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [itemId, price]);

  return flashing;
}

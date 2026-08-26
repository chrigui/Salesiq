import type { PublicRecapDTO } from "./resolve";

/**
 * The "you were here" snapshot captured after a real customer view — the
 * baseline the NEXT view's diff is computed against. Deliberately narrow
 * (price + availability per shortlisted item) because those are the only
 * two live-resolved fields the spec asks to honestly track drift on.
 */
export interface RecapViewedSnapshot {
  priceByItemId: Record<string, number>;
  availabilityByItemId: Record<string, string | null>;
  capturedAt: number;
}

export interface RecapPriceChange {
  itemId: string;
  itemName: string;
  currency: string;
  previousPrice: number;
  currentPrice: number;
  direction: "up" | "down";
}

export interface RecapAvailabilityChange {
  itemId: string;
  itemName: string;
  previousAvailability: string | null;
  currentAvailability: string | null;
  /** True once the item has moved into a state that means it can no longer be bought. */
  noLongerAvailable: boolean;
}

export interface RecapDiff {
  priceChanges: RecapPriceChange[];
  availabilityChanges: RecapAvailabilityChange[];
  hasChanges: boolean;
}

/** Availability labels (see src/lib/availability.ts) that mean "gone," not just "different." */
const UNAVAILABLE_STATUSES = new Set(["Reserved", "Booked", "Sold", "Sold out"]);

export function isUnavailableStatus(status: string | null): boolean {
  return Boolean(status && UNAVAILABLE_STATUSES.has(status));
}

/**
 * Captures what the customer is looking at right now, for comparison on
 * their next visit. Called once per real view (see the public events
 * route, PR13, which is the only writer of Recap.lastViewedSnapshot) —
 * this function itself has no side effects.
 */
export function buildViewedSnapshot(
  recap: Pick<PublicRecapDTO, "shortlistedProperties">,
): RecapViewedSnapshot {
  const priceByItemId: Record<string, number> = {};
  const availabilityByItemId: Record<string, string | null> = {};
  for (const s of recap.shortlistedProperties) {
    priceByItemId[s.item.id] = s.item.price;
    availabilityByItemId[s.item.id] = s.currentAvailability;
  }
  return { priceByItemId, availabilityByItemId, capturedAt: Date.now() };
}

/**
 * The salesperson-side counterpart to buildViewedSnapshot — the genesis
 * baseline of what was actually shown at the meeting (priceAtCreation/
 * availabilityAtCreation, frozen on each shortlisted item), rather than
 * what the customer's own last real view happened to see. Lets PR17's
 * property status-sync banner detect drift even when the customer has
 * never opened their Recap at all (lastViewedSnapshot stays null in that
 * case), matching the spec's "no customer interaction needed" requirement.
 */
export function buildCreationSnapshot(
  recap: Pick<PublicRecapDTO, "shortlistedProperties">,
): RecapViewedSnapshot {
  const priceByItemId: Record<string, number> = {};
  const availabilityByItemId: Record<string, string | null> = {};
  for (const s of recap.shortlistedProperties) {
    priceByItemId[s.item.id] = s.priceAtCreation;
    availabilityByItemId[s.item.id] = s.availabilityAtCreation;
  }
  return { priceByItemId, availabilityByItemId, capturedAt: 0 };
}

/**
 * Compares the last captured view against what's live right now. Every
 * entry is a real, resolvable change — an item missing from the previous
 * snapshot (just added to the shortlist since) is never reported as
 * "changed," and a first-ever view (previous === null) always yields no
 * changes rather than a fabricated "everything is new."
 */
export function computeRecapDiff(
  previous: RecapViewedSnapshot | null,
  recap: Pick<PublicRecapDTO, "shortlistedProperties">,
): RecapDiff {
  const priceChanges: RecapPriceChange[] = [];
  const availabilityChanges: RecapAvailabilityChange[] = [];

  if (previous) {
    for (const s of recap.shortlistedProperties) {
      const prevPrice = previous.priceByItemId[s.item.id];
      if (typeof prevPrice === "number" && prevPrice !== s.item.price) {
        priceChanges.push({
          itemId: s.item.id,
          itemName: s.item.name,
          currency: s.currency,
          previousPrice: prevPrice,
          currentPrice: s.item.price,
          direction: s.item.price > prevPrice ? "up" : "down",
        });
      }

      const prevAvailability = previous.availabilityByItemId[s.item.id];
      if (prevAvailability !== undefined && prevAvailability !== s.currentAvailability) {
        availabilityChanges.push({
          itemId: s.item.id,
          itemName: s.item.name,
          previousAvailability: prevAvailability,
          currentAvailability: s.currentAvailability,
          noLongerAvailable: isUnavailableStatus(s.currentAvailability),
        });
      }
    }
  }

  return {
    priceChanges,
    availabilityChanges,
    hasChanges: priceChanges.length > 0 || availabilityChanges.length > 0,
  };
}

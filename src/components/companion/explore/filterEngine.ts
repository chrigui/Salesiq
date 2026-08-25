/**
 * Pure filter logic for the Property Explorer — no React, no session
 * store, so it's trivially testable and impossible to accidentally couple
 * to the synced Buyer Profile. Filters are scoped to the current meeting
 * only (spec: "the filter state should remain connected to the current
 * meeting... do not permanently change the customer's Buyer Profile"),
 * so this never writes anywhere; the caller just holds an `ExploreFilters`
 * value in local component state.
 */
import type { BudgetValue, IndustryPack, InventoryItem } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { readPropertyAttributes } from "./attributeDisplay";
import { deriveAvailabilityLabel } from "@/lib/availability";

export interface ExploreFilters {
  propertyTypes: string[];
  bedrooms: number[];
  price: BudgetValue | null;
  locations: string[];
  features: string[];
  status: "Available" | "Sold out" | null;
}

export function emptyFilters(): ExploreFilters {
  return { propertyTypes: [], bedrooms: [], price: null, locations: [], features: [], status: null };
}

export function hasActiveFilters(f: ExploreFilters): boolean {
  return (
    f.propertyTypes.length > 0 ||
    f.bedrooms.length > 0 ||
    f.price !== null ||
    f.locations.length > 0 ||
    f.features.length > 0 ||
    f.status !== null
  );
}

/** Boolean attribute keys that aren't a propertyType option id — the real,
 * pack-agnostic definition of "a feature" (garden/seaView/quiet/etc, never
 * bedrooms/bathrooms/schools, which are numbers, and never apartment/villa/
 * studio/townhouse, which are the Property Type filter's own options). */
export function availableFeatureKeys(pack: IndustryPack): string[] {
  const typeOptionIds = new Set(pack.questions.find((q) => q.id === "propertyType")?.options?.map((o) => o.id) ?? []);
  const keys = new Set<string>();
  for (const item of pack.inventory) {
    for (const [key, value] of Object.entries(item.attributes)) {
      if (value === true && !typeOptionIds.has(key)) keys.add(key);
    }
  }
  return Array.from(keys);
}

export function featureLabel(pack: IndustryPack, key: string): string {
  for (const q of pack.questions) {
    const opt = q.options?.find((o) => o.id === key);
    if (opt) return opt.label;
  }
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
}

export function availablePropertyTypes(pack: IndustryPack): { id: string; label: string }[] {
  const question = pack.questions.find((q) => q.id === "propertyType");
  if (!question?.options) return [];
  const present = new Set<string>();
  for (const item of pack.inventory) {
    const attrs = readPropertyAttributes(pack, item);
    if (attrs.propertyType) {
      for (const opt of question.options) {
        if (item.attributes[opt.id] === true) present.add(opt.id);
      }
    }
  }
  return question.options.filter((o) => present.has(o.id)).map((o) => ({ id: o.id, label: o.label }));
}

export function availableBedroomCounts(pack: IndustryPack): number[] {
  const counts = new Set<number>();
  for (const item of pack.inventory) {
    const v = item.attributes.bedrooms;
    if (typeof v === "number") counts.add(v);
  }
  return Array.from(counts).sort((a, b) => a - b);
}

export function availableLocations(pack: IndustryPack): string[] {
  const labels = new Set<string>();
  for (const item of pack.inventory) {
    if (item.location?.label) labels.add(item.location.label);
  }
  return Array.from(labels).sort();
}

export function priceBounds(pack: IndustryPack): { min: number; max: number } | null {
  if (pack.inventory.length === 0) return null;
  const prices = pack.inventory.map((i) => i.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function hasAnyAvailabilityData(pack: IndustryPack): boolean {
  return pack.inventory.some((i) => i.unitsLeft !== undefined || i.availabilityStatus !== undefined);
}

function matchesFilters(pack: IndustryPack, item: InventoryItem, filters: ExploreFilters): boolean {
  if (filters.propertyTypes.length > 0 && !filters.propertyTypes.some((id) => item.attributes[id] === true)) {
    return false;
  }
  if (filters.bedrooms.length > 0) {
    const beds = item.attributes.bedrooms;
    if (typeof beds !== "number" || !filters.bedrooms.includes(beds)) return false;
  }
  if (filters.price && (item.price < filters.price.min || item.price > filters.price.max)) return false;
  if (filters.locations.length > 0 && !(item.location && filters.locations.includes(item.location.label))) {
    return false;
  }
  if (filters.features.length > 0 && !filters.features.every((f) => item.attributes[f] === true)) return false;
  if (filters.status) {
    const label = deriveAvailabilityLabel(item);
    // "Sold" (explicit admin status) and "Sold out" (unitsLeft-inferred)
    // are the same real-world bucket for this filter toggle — Reserved/
    // Booked items match neither today, which just leaves them out of
    // both toggles rather than misclassifying them.
    const matchesSoldOut = filters.status === "Sold out" && (label === "Sold out" || label === "Sold");
    if (label !== filters.status && !matchesSoldOut) return false;
  }
  return true;
}

export function applyFilters(pack: IndustryPack, scored: ScoredItem[], filters: ExploreFilters): ScoredItem[] {
  return scored.filter((s) => matchesFilters(pack, s.item, filters));
}

/** Which single filter, if dropped, would recover the most real matches —
 * a computed diagnostic, never a guess. Returns null if no active filter
 * would help, or if there are no active filters to drop. */
export function mostRestrictiveFilter(
  pack: IndustryPack,
  scored: ScoredItem[],
  filters: ExploreFilters,
): keyof ExploreFilters | null {
  const keys: (keyof ExploreFilters)[] = ["propertyTypes", "bedrooms", "price", "locations", "features", "status"];
  const currentCount = applyFilters(pack, scored, filters).length;
  let best: keyof ExploreFilters | null = null;
  let bestGain = 0;
  for (const key of keys) {
    const current = filters[key];
    const isActive = Array.isArray(current) ? current.length > 0 : current !== null;
    if (!isActive) continue;
    const without: ExploreFilters = { ...filters, [key]: Array.isArray(current) ? [] : null };
    const gain = applyFilters(pack, scored, without).length - currentCount;
    if (gain > bestGain) {
      bestGain = gain;
      best = key;
    }
  }
  return best;
}

export function withoutFilter(filters: ExploreFilters, key: keyof ExploreFilters): ExploreFilters {
  const current = filters[key];
  return { ...filters, [key]: Array.isArray(current) ? [] : null };
}

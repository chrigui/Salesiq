import "server-only";
import type { IndustryPack } from "@/core/types";
import { haversineMeters } from "@/lib/inventory/geo";

export interface DistrictDistance {
  district: string;
  distanceKm: number;
}

/**
 * Turns a geocoded point into real decision intelligence: which of this
 * pack's own districts (grouped from its real inventory's `location.label`,
 * centroid per group) sit closest to it. No hardcoded per-pack geography
 * table — it's derived entirely from the same real listing coordinates the
 * recommendation engine and Display already use, so it works for any pack
 * with located inventory, not just one hand-tuned city.
 */
export function nearestDistricts(pack: IndustryPack, point: { lat: number; lng: number }): DistrictDistance[] {
  const sums = new Map<string, { lat: number; lng: number; count: number }>();
  for (const item of pack.inventory) {
    if (!item.location) continue;
    const label = item.location.label;
    const entry = sums.get(label) ?? { lat: 0, lng: 0, count: 0 };
    entry.lat += item.location.lat;
    entry.lng += item.location.lng;
    entry.count += 1;
    sums.set(label, entry);
  }

  const distances: DistrictDistance[] = [];
  for (const [district, { lat, lng, count }] of sums) {
    const centroidLat = lat / count;
    const centroidLng = lng / count;
    distances.push({
      district,
      distanceKm: haversineMeters(point.lat, point.lng, centroidLat, centroidLng) / 1000,
    });
  }

  return distances.sort((a, b) => a.distanceKm - b.distanceKm);
}

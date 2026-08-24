/**
 * Pure geo math with zero side effects (no fetch, no env, no "server-only")
 * so both server-only code (src/lib/inventory/geo.ts, which re-exports this)
 * and client-side code (src/core/engine/scoring.ts, used directly by the
 * Companion and Customer Display) can share the same real distance
 * calculation instead of each keeping their own copy.
 */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

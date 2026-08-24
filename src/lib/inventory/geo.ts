import "server-only";
import type { NearbyAmenity } from "@/core/types";
import { haversineMeters } from "@/lib/geoMath";

export { haversineMeters };

/**
 * Free OpenStreetMap data sources — no API key, no signup (the user's chosen
 * provider). Nominatim's usage policy caps this at ~1 req/sec per app and
 * requires a real identifying User-Agent; both routes here are user-triggered
 * button clicks (Locate / Find nearby amenities), never a background loop, so
 * we stay well under that even without our own rate limiter.
 */
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "SalesIQ-InventoryBuilder/1.0 (contact: support@salesiq.app)";
const FETCH_TIMEOUT_MS = 10_000;
const AMENITY_RADIUS_METERS = 2000;
const MAX_AMENITIES_PER_KIND = 6;
const MAX_AMENITIES_TOTAL = 24;

export class GeoLookupError extends Error {
  constructor(
    message: string,
    public code: "invalid-query" | "not-found" | "lookup-failed",
  ) {
    super(message);
    this.name = "GeoLookupError";
  }
}

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) throw new GeoLookupError(`Upstream returned ${res.status}.`, "lookup-failed");
    return await res.json();
  } catch (err) {
    if (err instanceof GeoLookupError) throw err;
    throw new GeoLookupError("Couldn't reach the location service.", "lookup-failed");
  } finally {
    clearTimeout(timeout);
  }
}

/** Geocodes a free-form address/name into a real lat/lng via Nominatim. */
export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  const q = query.trim();
  if (!q) throw new GeoLookupError("Enter an address or project name first.", "invalid-query");

  const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
  const data = await fetchJson(url);
  const results = Array.isArray(data) ? data : [];
  const top = results[0] as { display_name?: string; lat?: string; lon?: string } | undefined;
  if (!top?.lat || !top?.lon) {
    throw new GeoLookupError("Couldn't find that location.", "not-found");
  }
  return { label: top.display_name ?? q, lat: Number(top.lat), lng: Number(top.lon) };
}

const OVERPASS_TAGS: { tag: string; kind: NearbyAmenity["kind"] }[] = [
  { tag: 'amenity="school"', kind: "school" },
  { tag: 'amenity="hospital"', kind: "hospital" },
  { tag: 'amenity="clinic"', kind: "hospital" },
  { tag: 'shop="supermarket"', kind: "supermarket" },
  { tag: 'leisure="park"', kind: "park" },
  { tag: 'amenity="restaurant"', kind: "restaurant" },
  { tag: 'highway="bus_stop"', kind: "transport" },
  { tag: 'railway="station"', kind: "transport" },
];

interface OverpassElement {
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** Finds real nearby amenities around a lat/lng via the Overpass API, sorted by distance. */
export async function findNearbyAmenities(lat: number, lng: number): Promise<NearbyAmenity[]> {
  const clauses = OVERPASS_TAGS.map(
    ({ tag }) =>
      `node[${tag}](around:${AMENITY_RADIUS_METERS},${lat},${lng});way[${tag}](around:${AMENITY_RADIUS_METERS},${lat},${lng});`,
  ).join("");
  const query = `[out:json][timeout:10];(${clauses});out center tags;`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let data: unknown;
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new GeoLookupError(`Upstream returned ${res.status}.`, "lookup-failed");
    data = await res.json();
  } catch (err) {
    if (err instanceof GeoLookupError) throw err;
    throw new GeoLookupError("Couldn't reach the amenities service.", "lookup-failed");
  } finally {
    clearTimeout(timeout);
  }

  const elements = (data as { elements?: OverpassElement[] })?.elements ?? [];
  const byKind = new Map<NearbyAmenity["kind"], NearbyAmenity[]>();

  for (const el of elements) {
    const name = el.tags?.name;
    if (!name) continue; // unnamed points aren't useful in a plain informational list
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat == null || elLng == null) continue;

    const matched = OVERPASS_TAGS.find(({ tag }) => {
      const [key, rawValue] = tag.split("=");
      return el.tags?.[key] === rawValue.replace(/"/g, "");
    });
    if (!matched) continue;

    const list = byKind.get(matched.kind) ?? [];
    if (list.some((a) => a.name === name)) continue; // dedupe (way+node pairs for the same place)
    list.push({
      name,
      kind: matched.kind,
      lat: elLat,
      lng: elLng,
      distanceMeters: Math.round(haversineMeters(lat, lng, elLat, elLng)),
    });
    byKind.set(matched.kind, list);
  }

  const result: NearbyAmenity[] = [];
  for (const list of byKind.values()) {
    list.sort((a, b) => a.distanceMeters - b.distanceMeters);
    result.push(...list.slice(0, MAX_AMENITIES_PER_KIND));
  }
  result.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return result.slice(0, MAX_AMENITIES_TOTAL);
}

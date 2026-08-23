"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { InventoryItem } from "@/core/types";

const STYLE_DARK = process.env.NEXT_PUBLIC_MAP_STYLE_DARK || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/**
 * A small, static (non-interactive) map pin — deliberately NOT the full
 * RealMap component (which manages pitch/bearing/POI overlays for the
 * full-screen Lifestyle Map hero). A grid of several small cards can't
 * afford one heavy 3D map instance per card.
 */
export function DisplayLocationMapInner({ item }: { item: InventoryItem }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || !item.location || mapRef.current) return;
    const { lat, lng } = item.location;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_DARK,
      center: [lng, lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    });
    new maplibregl.Marker({ color: "#22c55e" }).setLngLat([lng, lat]).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.location?.lat, item.location?.lng]);

  return <div ref={containerRef} className="h-full w-full" />;
}

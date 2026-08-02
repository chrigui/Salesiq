"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { cx } from "@/components/ui/primitives";
import type { BrochureWidgetContext } from "../types";

// Free, key-less vector styles (OSM data via CARTO) — same source as the
// interactive Display's RealMap.tsx, overridable with the same env vars.
const STYLE_DARK =
  process.env.NEXT_PUBLIC_MAP_STYLE_DARK ||
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const STYLE_LIGHT =
  process.env.NEXT_PUBLIC_MAP_STYLE_LIGHT ||
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/**
 * A lighter map for the public microsite — real pan/zoom/scroll for a
 * visitor exploring on their own, centered on the listing's location. Not
 * the interactive Display's full "theatre camera" (no scripted fly-tos, no
 * 3D building extrusion, no POI walking routes) — this is a browsing tool
 * for a stranger with a link, not a live-presented sales scene.
 */
export function BrochureMap({ item, dark }: BrochureWidgetContext) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || !item.location) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: dark ? STYLE_DARK : STYLE_LIGHT,
      center: [item.location.lng, item.location.lat],
      zoom: 13,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", () => {});
    map.once("load", () => {
      new maplibregl.Marker({ color: "#0e8f5b" })
        .setLngLat([item.location!.lng, item.location!.lat])
        .addTo(map);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.location?.lat, item.location?.lng, dark]);

  if (!item.location) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
      <h2 className={cx("mb-4 text-lg font-semibold", dark ? "text-white" : "text-zinc-900")}>
        Location {item.location.label ? `· ${item.location.label}` : ""}
      </h2>
      <div ref={containerRef} className="h-[360px] w-full overflow-hidden rounded-2xl" />
    </section>
  );
}

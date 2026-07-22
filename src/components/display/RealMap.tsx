"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { motion } from "framer-motion";
import maplibregl, { type Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Heart, TrainFront } from "lucide-react";
import type { InventoryItem, Poi } from "@/core/types";
import { formatMoney } from "@/core/engine/explain";
import { itemGradient, cx } from "@/components/ui/primitives";
import { Icon } from "@/lib/icon";

const ease = [0.22, 1, 0.36, 1] as const;
const ZOOM = 15;
const ZOOM_3D = 14; // pull back in 3D so the skyline + sky enter the frame
const BEARING = -18;
const RADIUS_M = 1000;
const METERS_PER_UNIT = 40;

const POI_COLOR: Record<Poi["kind"], string> = {
  school: "text-indigo-300 bg-indigo-500/20 ring-indigo-400/30",
  park: "text-emerald-300 bg-emerald-500/20 ring-emerald-400/30",
  shopping: "text-amber-300 bg-amber-500/20 ring-amber-400/30",
  health: "text-rose-300 bg-rose-500/20 ring-rose-400/30",
  transport: "text-sky-300 bg-sky-500/20 ring-sky-400/30",
  leisure: "text-orange-300 bg-orange-500/20 ring-orange-400/30",
  water: "text-cyan-300 bg-cyan-500/20 ring-cyan-400/30",
};

// Free, key-less vector styles (OSM data via CARTO). Both carry a building
// layer we extrude for true 3D. Override with env for OpenFreeMap/MapTiler/etc.
const STYLE_DARK =
  process.env.NEXT_PUBLIC_MAP_STYLE_DARK ||
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const STYLE_LIGHT =
  process.env.NEXT_PUBLIC_MAP_STYLE_LIGHT ||
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

type LL = [number, number]; // [lng, lat]
type Pt = { x: number; y: number };

function offsetLL(lng: number, lat: number, dxE: number, dyN: number): LL {
  const dLat = dyN / 111320;
  const dLng = dxE / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

function cssVar(name: string, alpha?: number): string {
  if (typeof window === "undefined") return "rgb(16,185,129)";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!v) return "rgb(16,185,129)";
  const parts = v.split(/\s+/).join(",");
  return alpha != null ? `rgba(${parts},${alpha})` : `rgb(${parts})`;
}

function circleFeature(center: LL, radiusM: number, pts = 72) {
  const [lng, lat] = center;
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  const coords: LL[] = [];
  for (let i = 0; i <= pts; i++) {
    const t = (i / pts) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [coords] },
    properties: {},
  };
}

export interface MapApi {
  zoomIn: () => void;
  zoomOut: () => void;
}

export function RealMap({
  item,
  night,
  arrival,
  familyMode,
  investmentMode,
  tilt = 0,
  apiRef,
}: {
  item: InventoryItem;
  night: boolean;
  arrival: boolean;
  familyMode: boolean;
  investmentMode: boolean;
  tilt?: number;
  apiRef?: MutableRefObject<MapApi | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const rafRef = useRef<number | null>(null);
  const firstDone = useRef(false);
  const nightRef = useRef(night);
  nightRef.current = night; // let the style-reload handler read the latest theme
  const [, setTick] = useState(0);

  const life = item.lifestyle;
  const center: LL = item.location
    ? [item.location.lng, item.location.lat]
    : [33.6, 34.9];

  const poiLL = (poi: Poi): LL => {
    const x0 = life?.at.x ?? 45;
    const y0 = life?.at.y ?? 43;
    return offsetLL(
      center[0],
      center[1],
      (poi.x - x0) * METERS_PER_UNIT,
      (y0 - poi.y) * METERS_PER_UNIT,
    );
  };
  const walkPois = (life?.pois ?? []).filter((p) =>
    p.detail.toLowerCase().includes("walk"),
  );

  // ---- init map once ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: night ? STYLE_DARK : STYLE_LIGHT,
      center,
      zoom: arrival ? 11.5 : ZOOM,
      pitch: tilt,
      bearing: BEARING,
      maxPitch: 75,
      interactive: false, // controlled "theatre" camera
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    const rerender = () => setTick((t) => (t + 1) % 1_000_000);
    map.on("move", rerender);
    map.on("zoom", rerender);
    map.on("pitch", rerender);
    map.on("rotate", rerender);

    const onStyle = () => {
      const n = nightRef.current;
      addSceneLayers(map, n);
      applyAtmosphere(map, n);
      updateSceneData(map, radiusFeature(), routesFeatures());
    };
    map.on("style.load", onStyle);
    map.once("load", () => {
      map.resize();
      if (arrival) {
        map.flyTo({ center, zoom: ZOOM, pitch: tilt, bearing: BEARING, duration: 2600 });
      }
      firstDone.current = true;
      startDashAnimation(map, (id) => (rafRef.current = id));
      rerender();
    });

    if (apiRef)
      apiRef.current = {
        zoomIn: () => map.zoomTo(map.getZoom() + 1, { duration: 400 }),
        zoomOut: () => map.zoomTo(map.getZoom() - 1, { duration: 400 }),
      };

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- day / night: swap the whole vector style, then re-add our layers ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !firstDone.current) return;
    map.setStyle(night ? STYLE_DARK : STYLE_LIGHT);
    // style.load handler re-adds scene layers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [night]);

  // ---- 3D tilt toggle ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !firstDone.current) return;
    map.easeTo({ pitch: tilt, zoom: tilt > 0 ? ZOOM_3D : ZOOM, duration: 800 });
  }, [tilt]);

  // ---- fly to a new district when the recommendation changes ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !firstDone.current) return;
    const zoom = tilt > 0 ? ZOOM_3D : ZOOM;
    map.flyTo({ center, zoom, pitch: tilt, bearing: BEARING, duration: 2200 });
    // refresh ground geometry for the new location
    updateSceneData(map, radiusFeature(), routesFeatures());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);

  // ---- family / investment paint tweaks ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !firstDone.current) return;
    safe(() =>
      map.setPaintProperty(
        "life-radius-line",
        "line-opacity",
        familyMode ? 0.95 : 0.6,
      ),
    );
    updateGrowth(map, center, investmentMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyMode, investmentMode]);

  function radiusFeature() {
    return circleFeature(center, RADIUS_M);
  }
  function routesFeatures() {
    return {
      type: "FeatureCollection" as const,
      features: walkPois.map((poi) => {
        const p = poiLL(poi);
        const mid: LL = [(center[0] + p[0]) / 2, (center[1] + p[1]) / 2];
        // small perpendicular bow
        const dx = p[0] - center[0];
        const dy = p[1] - center[1];
        const len = Math.hypot(dx, dy) || 1;
        const bow = 0.15;
        const bowed: LL = [mid[0] - (dy / len) * bow * len, mid[1] + (dx / len) * bow * len];
        return {
          type: "Feature" as const,
          geometry: { type: "LineString" as const, coordinates: [center, bowed, p] },
          properties: {},
        };
      }),
    };
  }

  const map = mapRef.current;
  const project = (ll: LL): Pt | null => {
    if (!map) return null;
    const p = map.project(ll);
    return { x: p.x, y: p.y };
  };
  const centerPx = project(center);

  return (
    <div className="absolute inset-0 isolate">
      <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />

      {/* Tint to seat tiles into the dark UI */}
      <div
        className={cx(
          "pointer-events-none absolute inset-0 z-[400]",
          night
            ? "bg-gradient-to-b from-[#070b14]/45 via-transparent to-[#070b14]/65"
            : "bg-gradient-to-b from-white/15 via-transparent to-black/15",
        )}
      />

      {/* DOM overlays — MapLibre's project() places them correctly under pitch */}
      <div className="pointer-events-none absolute inset-0 z-[500] overflow-hidden">
        {life && centerPx && (
          <>
            {walkPois.length > 0 && familyMode && centerPx && (
              <Standing x={centerPx.x} y={centerPx.y}>
                <div className="-translate-y-24 whitespace-nowrap rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-brand/40">
                  Walkable in 15 min
                </div>
              </Standing>
            )}

            {investmentMode && (
              <FutureInfra center={center} project={project} night={night} />
            )}

            {life.pois.map((poi, i) => {
              const p = project(poiLL(poi));
              if (!p) return null;
              const highlight = familyMode && (poi.kind === "school" || poi.kind === "park");
              return (
                <motion.div
                  key={poi.id}
                  className="absolute"
                  style={{ left: p.x, top: p.y, transform: "translate(-50%,-100%)" }}
                  initial={{ opacity: 0, y: 8, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.4, ease }}
                >
                  <div
                    className={cx(
                      "flex items-center gap-2 rounded-full border px-2.5 py-1.5 backdrop-blur-xl",
                      night
                        ? "border-white/15 bg-black/55 text-white"
                        : "border-white/70 bg-white/85 text-zinc-800 shadow-lg shadow-black/10",
                      highlight && "ring-2 ring-brand/70",
                    )}
                    style={highlight ? { boxShadow: "0 0 22px rgb(var(--brand) / 0.45)" } : undefined}
                  >
                    <span className={cx("grid h-6 w-6 place-items-center rounded-full ring-1", POI_COLOR[poi.kind])}>
                      <Icon name={poi.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="pr-1 text-xs font-medium leading-tight">
                      {poi.label}
                      <span className={night ? "block text-white/50" : "block text-zinc-500"}>
                        {poi.detail}
                      </span>
                    </span>
                  </div>
                  <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full" style={{ background: "rgb(var(--brand))" }} />
                </motion.div>
              );
            })}

            {/* Property */}
            <motion.div
              className="absolute w-60"
              style={{ left: centerPx.x, top: centerPx.y, transform: "translate(-50%,-100%)" }}
              initial={{ opacity: 0, y: 30, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.7, ease }}
            >
              <div
                className={cx(
                  "overflow-hidden rounded-3xl border shadow-2xl shadow-black/50 backdrop-blur-xl",
                  night ? "border-white/15 bg-black/60" : "border-white/70 bg-white/90",
                )}
              >
                <div className={cx("relative h-24 bg-gradient-to-br", itemGradient(item.image))}>
                  <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white backdrop-blur">
                    <Heart className="h-4 w-4" />
                  </div>
                </div>
                <div className={cx("p-4", night ? "text-white" : "text-zinc-900")}>
                  <div className="text-lg font-semibold leading-tight">{item.name}</div>
                  <div className={cx("text-xs", night ? "text-white/60" : "text-zinc-500")}>
                    {life.beds} Beds · {life.sqm} sqm
                  </div>
                  <div className="mt-1.5 text-lg font-semibold text-brand">
                    {formatMoney(item.price, item.currency)}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

function Standing({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute" style={{ left: x, top: y, transform: "translate(-50%,-100%)" }}>
      {children}
    </div>
  );
}

function FutureInfra({
  center,
  project,
  night,
}: {
  center: LL;
  project: (ll: LL) => Pt | null;
  night: boolean;
}) {
  const p = project(offsetLL(center[0], center[1], -650, -850));
  if (!p) return null;
  return (
    <motion.div
      className="absolute"
      style={{ left: p.x, top: p.y, transform: "translate(-50%,-100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.85, 0.5, 0.85] }}
      transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, delay: 1 }}
    >
      <div
        className={cx(
          "flex items-center gap-2 whitespace-nowrap rounded-full border border-dashed px-2.5 py-1.5 text-xs font-medium backdrop-blur-md",
          night
            ? "border-amber-300/50 bg-amber-400/10 text-amber-200"
            : "border-amber-500/50 bg-amber-400/20 text-amber-700",
        )}
      >
        <TrainFront className="h-3.5 w-3.5" />
        Metro Line 2 · opening 2027
      </div>
    </motion.div>
  );
}

/* ----------------------- MapLibre scene helpers ----------------------- */

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    /* layer/source may not exist yet after a style swap */
  }
}

function firstVectorSource(map: MLMap): string | null {
  const sources = map.getStyle()?.sources ?? {};
  for (const [id, s] of Object.entries(sources)) {
    if ((s as { type?: string }).type === "vector") return id;
  }
  return null;
}

/** Subtle atmospheric sky + fog and directional light for the 3D buildings. */
function applyAtmosphere(map: MLMap, night: boolean) {
  // Sky + fog (MapLibre v4 `setSky` also carries the fog fields). Feature-detected.
  safe(() => {
    const m = map as unknown as { setSky?: (s: Record<string, unknown>) => void };
    if (typeof m.setSky !== "function") return;
    m.setSky(
      night
        ? {
            "sky-color": "#0a1326",
            "sky-horizon-blend": 0.7,
            "horizon-color": "#1a2742",
            "horizon-fog-blend": 0.6,
            "fog-color": "#0b1220",
            "fog-ground-blend": 0.75,
            "atmosphere-blend": 0.55,
          }
        : {
            "sky-color": "#bfe0f5",
            "sky-horizon-blend": 0.6,
            "horizon-color": "#e8f0f7",
            "horizon-fog-blend": 0.6,
            "fog-color": "#eaeff5",
            "fog-ground-blend": 0.7,
            "atmosphere-blend": 0.6,
          },
    );
  });

  // Directional light so the extruded buildings gain form and shadowed sides.
  safe(() =>
    map.setLight({
      anchor: "viewport",
      color: night ? "#aec4ff" : "#ffffff",
      intensity: night ? 0.35 : 0.5,
      position: [1.3, 210, 30], // [radial, azimuth°, polar°]
    }),
  );
}

/** Extruded 3D buildings + the lifestyle radius + walking-route lines. */
function addSceneLayers(map: MLMap, night: boolean) {
  const brand = cssVar("--brand");

  // 3D buildings from the style's vector source (best-effort across schemas).
  safe(() => {
    if (map.getLayer("siq-buildings")) return;
    const src = firstVectorSource(map);
    if (!src) return;
    map.addLayer({
      id: "siq-buildings",
      source: src,
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 13,
      paint: {
        "fill-extrusion-color": night ? "#26344a" : "#cbd5e1",
        "fill-extrusion-height": [
          "coalesce",
          ["get", "render_height"],
          ["get", "height"],
          10,
        ],
        "fill-extrusion-base": [
          "coalesce",
          ["get", "render_min_height"],
          ["get", "min_height"],
          0,
        ],
        "fill-extrusion-opacity": 0.85,
      },
    });
  });

  // Lifestyle radius (ground) — sits below buildings/labels.
  safe(() => {
    if (!map.getSource("life-radius"))
      map.addSource("life-radius", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    if (!map.getLayer("life-radius-fill"))
      map.addLayer({
        id: "life-radius-fill",
        type: "fill",
        source: "life-radius",
        paint: { "fill-color": brand, "fill-opacity": 0.08 },
      });
    if (!map.getLayer("life-radius-line"))
      map.addLayer({
        id: "life-radius-line",
        type: "line",
        source: "life-radius",
        paint: { "line-color": brand, "line-width": 1.5, "line-opacity": 0.7 },
      });
  });

  // Growth areas (investment) — hidden until toggled.
  safe(() => {
    if (!map.getSource("growth"))
      map.addSource("growth", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    if (!map.getLayer("growth-fill"))
      map.addLayer({
        id: "growth-fill",
        type: "fill",
        source: "growth",
        paint: { "fill-color": brand, "fill-opacity": 0.14 },
      });
  });

  // Walking routes.
  safe(() => {
    if (!map.getSource("routes"))
      map.addSource("routes", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    if (!map.getLayer("routes-base"))
      map.addLayer({
        id: "routes-base",
        type: "line",
        source: "routes",
        paint: { "line-color": brand, "line-width": 3, "line-opacity": 0.35 },
        layout: { "line-cap": "round" },
      });
    if (!map.getLayer("routes-dash"))
      map.addLayer({
        id: "routes-dash",
        type: "line",
        source: "routes",
        paint: {
          "line-color": brand,
          "line-width": 3,
          "line-dasharray": [0, 4, 3],
        },
        layout: { "line-cap": "round" },
      });
  });
}

function updateSceneData(
  map: MLMap,
  radius: ReturnType<typeof circleFeature>,
  routes: { type: "FeatureCollection"; features: unknown[] },
) {
  safe(() =>
    (map.getSource("life-radius") as maplibregl.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: [radius],
    } as GeoJSON.FeatureCollection),
  );
  safe(() =>
    (map.getSource("routes") as maplibregl.GeoJSONSource | undefined)?.setData(
      routes as unknown as GeoJSON.FeatureCollection,
    ),
  );
}

function updateGrowth(map: MLMap, center: LL, on: boolean) {
  const features = on
    ? [
        circleFeature(center, 900),
        circleFeature(offsetLL(center[0], center[1], 800, 700), 650),
        circleFeature(offsetLL(center[0], center[1], -900, -500), 550),
      ]
    : [];
  safe(() =>
    (map.getSource("growth") as maplibregl.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features,
    } as GeoJSON.FeatureCollection),
  );
}

// "Ant-path" dash animation for the walking routes.
const DASH_SEQ: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];
function startDashAnimation(map: MLMap, keep: (id: number) => void) {
  let step = 0;
  const tick = (ts: number) => {
    const next = Math.floor((ts / 60) % DASH_SEQ.length);
    if (next !== step) {
      step = next;
      safe(() => map.setPaintProperty("routes-dash", "line-dasharray", DASH_SEQ[step]));
    }
    keep(requestAnimationFrame(tick));
  };
  keep(requestAnimationFrame(tick));
}

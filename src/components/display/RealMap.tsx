"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Heart, TrainFront } from "lucide-react";
import type { InventoryItem, Poi } from "@/core/types";
import { formatMoney } from "@/core/engine/explain";
import { itemGradient, cx } from "@/components/ui/primitives";
import { Icon } from "@/lib/icon";

const ease = [0.22, 1, 0.36, 1] as const;
const ZOOM = 15;
const RADIUS_M = 1000; // lifestyle radius in metres
const METERS_PER_UNIT = 40; // maps the 0..100 layout onto real metres

const POI_COLOR: Record<Poi["kind"], string> = {
  school: "text-indigo-300 bg-indigo-500/20 ring-indigo-400/30",
  park: "text-emerald-300 bg-emerald-500/20 ring-emerald-400/30",
  shopping: "text-amber-300 bg-amber-500/20 ring-amber-400/30",
  health: "text-rose-300 bg-rose-500/20 ring-rose-400/30",
  transport: "text-sky-300 bg-sky-500/20 ring-sky-400/30",
  leisure: "text-orange-300 bg-orange-500/20 ring-orange-400/30",
  water: "text-cyan-300 bg-cyan-500/20 ring-cyan-400/30",
};

// Free, key-less OpenStreetMap-based tiles. CARTO's dark/light basemaps keep
// the premium look and give us a real day/night toggle. Override via env for a
// managed provider or raw tile.openstreetmap.org.
const DARK_TILES =
  process.env.NEXT_PUBLIC_TILES_DARK ||
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES =
  process.env.NEXT_PUBLIC_TILES_LIGHT ||
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIB =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

type LatLng = [number, number];

/** Move `metres` east (dxE) and north (dyN) from a lat/lng. */
function offset(lat: number, lng: number, dxE: number, dyN: number): LatLng {
  const dLat = dyN / 111320;
  const dLng = dxE / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}

export interface MapApi {
  zoomIn: () => void;
  zoomOut: () => void;
}

/**
 * The Interactive Lifestyle Map rendered on real OpenStreetMap tiles.
 * Floating panels (handled by the parent) stay fixed; everything here is
 * anchored to true coordinates and tracks the map as the camera flies.
 */
export function RealMap({
  item,
  night,
  arrival,
  familyMode,
  investmentMode,
  apiRef,
}: {
  item: InventoryItem;
  night: boolean;
  arrival: boolean;
  familyMode: boolean;
  investmentMode: boolean;
  apiRef?: MutableRefObject<MapApi | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const firstFlyDone = useRef(false);
  const [, setTick] = useState(0);

  const center: LatLng = item.location
    ? [item.location.lat, item.location.lng]
    : [34.9, 33.6];

  // Init the Leaflet map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      fadeAnimation: true,
      zoomSnap: 0.25,
    });
    map.attributionControl.setPrefix(false);
    mapRef.current = map;

    if (arrival) {
      map.setView(center, 11, { animate: false });
      window.setTimeout(() => {
        map.flyTo(center, ZOOM, { duration: 2.4 });
      }, 250);
    } else {
      map.setView(center, ZOOM, { animate: false });
    }
    firstFlyDone.current = true;

    const rerender = () => setTick((t) => (t + 1) % 1_000_000);
    map.on("move zoom zoomanim moveend resize load", rerender);
    window.setTimeout(() => {
      map.invalidateSize();
      rerender();
    }, 120);

    if (apiRef) apiRef.current = { zoomIn: () => map.zoomIn(), zoomOut: () => map.zoomOut() };

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap tiles on day/night.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(night ? DARK_TILES : LIGHT_TILES, {
      subdomains: "abcd",
      maxZoom: 20,
      attribution: TILE_ATTRIB,
      detectRetina: true,
    }).addTo(map);
  }, [night]);

  // Fly to a new district when the recommended property changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !firstFlyDone.current) return;
    map.flyTo(center, ZOOM, { duration: 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);

  const life = item.lifestyle;
  const map = mapRef.current;

  // Project a lat/lng to a pixel position in the container (if the map is ready).
  const project = (ll: LatLng) => {
    if (!map) return null;
    const p = map.latLngToContainerPoint(ll);
    return { x: p.x, y: p.y };
  };

  const centerPx = project(center);
  // Pixel length of the lifestyle radius at the current zoom.
  const edgePx = project(offset(center[0], center[1], RADIUS_M, 0));
  const radiusPx =
    centerPx && edgePx ? Math.hypot(edgePx.x - centerPx.x, edgePx.y - centerPx.y) : 0;

  const poiLatLng = (poi: Poi): LatLng => {
    const x0 = life?.at.x ?? 45;
    const y0 = life?.at.y ?? 43;
    return offset(
      center[0],
      center[1],
      (poi.x - x0) * METERS_PER_UNIT,
      (y0 - poi.y) * METERS_PER_UNIT,
    );
  };

  return (
    // `isolate` contains Leaflet's internal z-indexes (its panes go up to ~700)
    // so they can't paint over the floating UI panels rendered by the parent.
    <div className="absolute inset-0 isolate">
      {/* Leaflet canvas */}
      <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />

      {/* Tint to seat the tiles into the dark UI and lift contrast for overlays */}
      <div
        className={cx(
          "pointer-events-none absolute inset-0 z-[400]",
          night
            ? "bg-gradient-to-b from-[#070b14]/55 via-[#070b14]/10 to-[#070b14]/70"
            : "bg-gradient-to-b from-white/20 via-transparent to-black/20",
        )}
      />

      {/* Map-anchored overlays — above the tiles, below the parent's UI panels */}
      <div className="pointer-events-none absolute inset-0 z-[500] overflow-hidden">
        {life && centerPx && radiusPx > 0 && (
          <>
            {/* Lifestyle radius */}
            <div
              className="absolute"
              style={{ left: centerPx.x, top: centerPx.y, transform: "translate(-50%,-50%)" }}
            >
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: radiusPx * 2,
                    height: radiusPx * 2,
                    left: "50%",
                    top: "50%",
                    x: "-50%",
                    y: "-50%",
                    border: `1px solid rgb(var(--brand) / ${night ? 0.55 : 0.65})`,
                    boxShadow: `0 0 60px rgb(var(--brand) / ${night ? 0.28 : 0.16}) inset`,
                    background: `radial-gradient(circle, rgb(var(--brand) / 0.10), transparent 70%)`,
                  }}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.9 }}
                  transition={{ duration: 1.2, ease, delay: 0.2 + i * 0.15 }}
                />
              ))}

              {/* Family: calm walkable sonar rings + marker */}
              {familyMode &&
                [0, 1, 2].map((i) => (
                  <motion.div
                    key={`w${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: radiusPx * 2,
                      height: radiusPx * 2,
                      left: "50%",
                      top: "50%",
                      x: "-50%",
                      y: "-50%",
                      border: "1.5px solid rgb(var(--brand) / 0.55)",
                    }}
                    initial={{ scale: 0.15, opacity: 0 }}
                    animate={{ scale: [0.15, 1.05], opacity: [0.55, 0] }}
                    transition={{ duration: 4.2, ease: "easeOut", repeat: Infinity, delay: 0.6 + i * 1.4 }}
                  />
                ))}
              {familyMode && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-brand/40"
                  style={{ top: -radiusPx - 14 }}
                >
                  Walkable in 15 min
                </div>
              )}
            </div>

            {/* Investment: growth heatmap + a ghosted future transit line */}
            {investmentMode && (
              <HeatmapAndInfra
                center={center}
                night={night}
                project={project}
                offsetFn={offset}
                radiusPx={radiusPx}
              />
            )}

            {/* POIs */}
            {life.pois.map((poi, i) => {
              const p = project(poiLatLng(poi));
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
                        ? "border-white/15 bg-black/50 text-white"
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

            {/* The property */}
            <motion.div
              className="absolute w-60"
              style={{ left: centerPx.x, top: centerPx.y, transform: "translate(-50%,-50%)" }}
              initial={{ opacity: 0, y: 30, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.7, ease }}
            >
              <div
                className={cx(
                  "overflow-hidden rounded-3xl border shadow-2xl shadow-black/50 backdrop-blur-xl",
                  night ? "border-white/15 bg-black/55" : "border-white/70 bg-white/90",
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

function HeatmapAndInfra({
  center,
  night,
  project,
  offsetFn,
  radiusPx,
}: {
  center: LatLng;
  night: boolean;
  project: (ll: LatLng) => { x: number; y: number } | null;
  offsetFn: (lat: number, lng: number, dxE: number, dyN: number) => LatLng;
  radiusPx: number;
}) {
  const [lat, lng] = center;
  const spots: { ll: LatLng; r: number; hot: boolean }[] = [
    { ll: center, r: radiusPx * 1.15, hot: true },
    { ll: offsetFn(lat, lng, 800, 700), r: radiusPx * 0.8, hot: true },
    { ll: offsetFn(lat, lng, -900, -500), r: radiusPx * 0.7, hot: false },
    { ll: offsetFn(lat, lng, 700, -800), r: radiusPx * 0.65, hot: false },
  ];
  const infra = project(offsetFn(lat, lng, -650, -850));
  return (
    <>
      {spots.map((s, i) => {
        const p = project(s.ll);
        if (!p) return null;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: s.r * 2,
              height: s.r * 2,
              transform: "translate(-50%,-50%)",
              background: s.hot
                ? "radial-gradient(circle, rgba(52,211,153,0.40), rgba(245,158,11,0.14) 55%, transparent 72%)"
                : "radial-gradient(circle, rgba(245,158,11,0.28), transparent 70%)",
              filter: "blur(6px)",
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 0.9, 0.6, 0.9], scale: [0.7, 1, 0.94, 1] }}
            transition={{ duration: 6 + i, ease: "easeInOut", repeat: Infinity, delay: 0.4 + i * 0.5 }}
          />
        );
      })}
      {infra && (
        <motion.div
          className="absolute"
          style={{ left: infra.x, top: infra.y, transform: "translate(-50%,-50%)" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 0.85, 0.5, 0.85], y: 0 }}
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
      )}
    </>
  );
}

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

const DARK_TILES =
  process.env.NEXT_PUBLIC_TILES_DARK ||
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES =
  process.env.NEXT_PUBLIC_TILES_LIGHT ||
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIB =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

type LatLng = [number, number];
type Pt = { x: number; y: number };

function offset(lat: number, lng: number, dxE: number, dyN: number): LatLng {
  const dLat = dyN / 111320;
  const dLng = dxE / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
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
  /** 3D pitch in degrees (0 = flat). */
  tilt?: number;
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      dragging: false, // controlled "theatre" camera (and CSS tilt-safe)
      fadeAnimation: true,
      zoomSnap: 0.25,
    });
    map.attributionControl.setPrefix(false);
    mapRef.current = map;

    if (arrival) {
      map.setView(center, 11, { animate: false });
      window.setTimeout(() => map.flyTo(center, ZOOM, { duration: 2.4 }), 250);
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

    if (apiRef)
      apiRef.current = { zoomIn: () => map.zoomIn(), zoomOut: () => map.zoomOut() };

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !firstFlyDone.current) return;
    map.flyTo(center, ZOOM, { duration: 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);

  const life = item.lifestyle;
  const map = mapRef.current;

  const project = (ll: LatLng): Pt | null => {
    if (!map) return null;
    const p = map.latLngToContainerPoint(ll);
    return { x: p.x, y: p.y };
  };

  const centerPx = project(center);
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

  const size = map?.getSize();
  const W = size?.x ?? 0;
  const H = size?.y ?? 0;

  // "Standing" overlays are billboarded so they stay upright on the tilted ground.
  const billboard = (anchor: "bottom" | "center"): React.CSSProperties => ({
    transform: `${anchor === "center" ? "translate(-50%,-50%)" : "translate(-50%,-100%)"} rotateX(${-tilt}deg)`,
    transformOrigin: "50% 100%",
  });

  // Walkable amenities get an animated route on the ground.
  const walkPois = (life?.pois ?? []).filter((p) =>
    p.detail.toLowerCase().includes("walk"),
  );

  return (
    <div className="absolute inset-0 isolate" style={{ perspective: "1500px" }}>
      {/* The tilting "ground" — tiles, tint, ground-plane overlays + standing markers */}
      <div
        className="absolute inset-0"
        style={{
          transform: tilt ? `rotateX(${tilt}deg)` : undefined,
          transformOrigin: "50% 74%",
          transformStyle: "preserve-3d",
          transition: "transform 700ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />

        <div
          className={cx(
            "pointer-events-none absolute inset-0 z-[400]",
            night
              ? "bg-gradient-to-b from-[#070b14]/55 via-[#070b14]/10 to-[#070b14]/70"
              : "bg-gradient-to-b from-white/20 via-transparent to-black/20",
          )}
        />

        <div
          className="pointer-events-none absolute inset-0 z-[500] overflow-hidden"
          style={{ transformStyle: "preserve-3d" }}
        >
          {life && centerPx && radiusPx > 0 && (
            <>
              {/* Walking routes on the ground (not billboarded) */}
              {W > 0 && (
                <svg
                  className="absolute inset-0"
                  width={W}
                  height={H}
                  style={{ overflow: "visible" }}
                >
                  {walkPois.map((poi) => {
                    const p = project(poiLatLng(poi));
                    if (!p || !centerPx) return null;
                    const mx = (centerPx.x + p.x) / 2;
                    const my = (centerPx.y + p.y) / 2;
                    // perpendicular bow for a natural, non-straight path
                    const nx = -(p.y - centerPx.y);
                    const ny = p.x - centerPx.x;
                    const nlen = Math.hypot(nx, ny) || 1;
                    const bow = 26;
                    const cxp = mx + (nx / nlen) * bow;
                    const cyp = my + (ny / nlen) * bow;
                    const d = `M ${centerPx.x} ${centerPx.y} Q ${cxp} ${cyp} ${p.x} ${p.y}`;
                    return (
                      <g key={poi.id}>
                        <motion.path
                          d={d}
                          fill="none"
                          stroke="rgb(var(--brand))"
                          strokeOpacity={0.35}
                          strokeWidth={3}
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, ease, delay: 0.5 }}
                        />
                        <motion.path
                          d={d}
                          fill="none"
                          stroke="rgb(var(--brand))"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeDasharray="2 12"
                          initial={{ strokeDashoffset: 0 }}
                          animate={{ strokeDashoffset: -140 }}
                          transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Lifestyle radius (ground ellipse under tilt) */}
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
              </div>

              {/* Investment heatmap (ground) */}
              {investmentMode && (
                <HeatmapLayer center={center} project={project} radiusPx={radiusPx} />
              )}

              {/* Family walkable marker (standing) */}
              {familyMode && (
                <div className="absolute" style={{ left: centerPx.x, top: centerPx.y - radiusPx, transformStyle: "preserve-3d" }}>
                  <div style={billboard("center")}>
                    <div className="-translate-y-3 whitespace-nowrap rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-brand/40">
                      Walkable in 15 min
                    </div>
                  </div>
                </div>
              )}

              {/* Future transit (standing) */}
              {investmentMode && (
                <StandingInfra center={center} project={project} tilt={tilt} night={night} />
              )}

              {/* POI pins (standing) */}
              {life.pois.map((poi, i) => {
                const p = project(poiLatLng(poi));
                if (!p) return null;
                const highlight = familyMode && (poi.kind === "school" || poi.kind === "park");
                return (
                  <div
                    key={poi.id}
                    className="absolute"
                    style={{ left: p.x, top: p.y, transformStyle: "preserve-3d" }}
                  >
                    <div style={billboard("bottom")}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
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
                    </div>
                  </div>
                );
              })}

              {/* Property (standing) */}
              <div
                className="absolute"
                style={{ left: centerPx.x, top: centerPx.y, transformStyle: "preserve-3d" }}
              >
                <div style={billboard("bottom")}>
                  <motion.div
                    className="w-60"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
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
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HeatmapLayer({
  center,
  project,
  radiusPx,
}: {
  center: LatLng;
  project: (ll: LatLng) => Pt | null;
  radiusPx: number;
}) {
  const [lat, lng] = center;
  const spots: { ll: LatLng; r: number; hot: boolean }[] = [
    { ll: center, r: radiusPx * 1.15, hot: true },
    { ll: offset(lat, lng, 800, 700), r: radiusPx * 0.8, hot: true },
    { ll: offset(lat, lng, -900, -500), r: radiusPx * 0.7, hot: false },
    { ll: offset(lat, lng, 700, -800), r: radiusPx * 0.65, hot: false },
  ];
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
    </>
  );
}

function StandingInfra({
  center,
  project,
  tilt,
  night,
}: {
  center: LatLng;
  project: (ll: LatLng) => Pt | null;
  tilt: number;
  night: boolean;
}) {
  const p = project(offset(center[0], center[1], -650, -850));
  if (!p) return null;
  return (
    <div className="absolute" style={{ left: p.x, top: p.y, transformStyle: "preserve-3d" }}>
      <div
        style={{
          transform: `translate(-50%,-100%) rotateX(${-tilt}deg)`,
          transformOrigin: "50% 100%",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0.5, 0.85] }}
          transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, delay: 1 }}
          className={cx(
            "flex items-center gap-2 whitespace-nowrap rounded-full border border-dashed px-2.5 py-1.5 text-xs font-medium backdrop-blur-md",
            night
              ? "border-amber-300/50 bg-amber-400/10 text-amber-200"
              : "border-amber-500/50 bg-amber-400/20 text-amber-700",
          )}
        >
          <TrainFront className="h-3.5 w-3.5" />
          Metro Line 2 · opening 2027
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";

/**
 * A hand-built, premium *stylized* aerial map — no external tiles, no tokens,
 * fully offline. It is deliberately abstract: a coastline, a soft street grid,
 * parks and (at night) a scatter of lit windows. It sets the cinematic stage;
 * the POIs and property float above it in CSS-percentage space.
 */

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// Coastline: everything to the right of this x (for a given y) is water.
function coastX(y: number) {
  return 116 + 10 * Math.sin(y / 13) + 6 * Math.cos(y / 5);
}

interface World {
  buildings: { x: number; y: number; w: number; h: number }[];
  lights: { x: number; y: number; r: number; warm: boolean }[];
  parks: { cx: number; cy: number; rx: number; ry: number }[];
  roads: string[];
  coast: string;
}

function buildWorld(seed: number): World {
  const rnd = seeded(seed);
  const buildings: World["buildings"] = [];
  const lights: World["lights"] = [];

  for (let gx = 4; gx < 128; gx += 6.2) {
    for (let gy = 4; gy < 96; gy += 6.4) {
      const jx = gx + (rnd() - 0.5) * 3;
      const jy = gy + (rnd() - 0.5) * 3;
      if (jx > coastX(jy) - 4) continue; // in the water
      if (rnd() < 0.18) continue; // gaps / streets
      const w = 2 + rnd() * 3.4;
      const h = 2 + rnd() * 3.4;
      buildings.push({ x: jx, y: jy, w, h });
      if (rnd() < 0.5) {
        lights.push({
          x: jx + w * rnd(),
          y: jy + h * rnd(),
          r: 0.28 + rnd() * 0.5,
          warm: rnd() < 0.7,
        });
      }
    }
  }

  const parks: World["parks"] = [
    { cx: 26, cy: 34, rx: 9, ry: 6 },
    { cx: 62, cy: 70, rx: 11, ry: 7 },
    { cx: 90, cy: 26, rx: 7, ry: 5 },
    { cx: 44, cy: 88, rx: 8, ry: 5 },
  ];

  const roads: string[] = [
    "M -5 22 C 30 18, 70 30, 130 20",
    "M -5 52 C 40 46, 80 60, 128 50",
    "M -5 78 C 35 74, 75 86, 126 76",
    "M 20 -5 C 16 40, 28 70, 22 105",
    "M 58 -5 C 54 35, 66 70, 60 105",
    "M 96 -5 C 92 30, 104 60, 98 105",
  ];

  // Coastline polygon covering the water side.
  let coast = "M 160 -5 L 160 105 ";
  for (let y = 105; y >= -5; y -= 6) coast += `L ${coastX(y).toFixed(1)} ${y} `;
  coast += "Z";

  return { buildings, lights, parks, roads, coast };
}

export function StylizedMap({ night }: { night: boolean }) {
  const world = useMemo(() => buildWorld(20260722), []);

  const c = night
    ? {
        land0: "#0b1220",
        land1: "#0e1626",
        water0: "#060b16",
        water1: "#0a1526",
        building: "rgba(255,255,255,0.05)",
        buildingStroke: "rgba(255,255,255,0.06)",
        road: "rgba(255,255,255,0.06)",
        park: "rgba(52,211,153,0.10)",
      }
    : {
        land0: "#eef1f4",
        land1: "#e5e9ee",
        water0: "#cfe0ec",
        water1: "#bcd4e6",
        building: "rgba(120,130,145,0.16)",
        buildingStroke: "rgba(120,130,145,0.10)",
        road: "rgba(255,255,255,0.7)",
        park: "rgba(120,190,140,0.35)",
      };

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.land0} />
          <stop offset="100%" stopColor={c.land1} />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.water0} />
          <stop offset="100%" stopColor={c.water1} />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor={night ? "rgba(120,140,220,0.18)" : "rgba(255,240,210,0.5)"}
          />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="160" height="100" fill="url(#land)" />

      {/* Parks */}
      {world.parks.map((p, i) => (
        <ellipse
          key={`p${i}`}
          cx={p.cx}
          cy={p.cy}
          rx={p.rx}
          ry={p.ry}
          fill={c.park}
          filter="url(#soft)"
        />
      ))}

      {/* Streets */}
      {world.roads.map((d, i) => (
        <path key={`r${i}`} d={d} stroke={c.road} strokeWidth={1.4} fill="none" />
      ))}

      {/* Buildings */}
      {world.buildings.map((b, i) => (
        <rect
          key={`b${i}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx={0.6}
          fill={c.building}
          stroke={c.buildingStroke}
          strokeWidth={0.15}
        />
      ))}

      {/* Night window lights */}
      {night &&
        world.lights.map((l, i) => (
          <circle
            key={`l${i}`}
            cx={l.x}
            cy={l.y}
            r={l.r}
            fill={l.warm ? "rgba(255,214,150,0.9)" : "rgba(180,205,255,0.85)"}
          />
        ))}

      {/* Water */}
      <path d={world.coast} fill="url(#water)" />
      {/* Ambient light bloom over the scene */}
      <rect x="0" y="0" width="160" height="100" fill="url(#glow)" opacity="0.6" />
    </svg>
  );
}

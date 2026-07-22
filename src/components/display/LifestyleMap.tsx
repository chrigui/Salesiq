"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Share2,
  Menu,
  Sun,
  Moon,
  Plus,
  Minus,
  Sparkles,
  AudioLines,
  ArrowRight,
  Diamond,
  TrendingUp,
} from "lucide-react";
import type { InventoryItem, IndustryPack } from "@/core/types";
import { formatMoney } from "@/core/engine/explain";
import { cx } from "@/components/ui/primitives";
import { Icon } from "@/lib/icon";
import type { MapApi } from "./RealMap";

// Leaflet touches `window`, so the real map is client-only.
const RealMap = dynamic(() => import("./RealMap").then((m) => m.RealMap), {
  ssr: false,
});

const ease = [0.22, 1, 0.36, 1] as const;

/** Keep the on-map reasoning tight — the first two sentences read from metres away. */
function shorten(text: string, sentences = 2): string {
  const parts = text.match(/[^.!?]+[.!?]+/g);
  if (!parts) return text;
  return parts.slice(0, sentences).join("").trim();
}

const LAYERS = [
  { id: "lifestyle", label: "Lifestyle", icon: "Users" },
  { id: "schools", label: "Schools", icon: "GraduationCap" },
  { id: "transport", label: "Transport", icon: "TrainFront" },
  { id: "health", label: "Health", icon: "HeartPulse" },
  { id: "more", label: "More", icon: "LayoutGrid" },
];

/**
 * The Interactive Lifestyle Map — the platform's "decision theatre".
 * The map is the hero canvas; everything else floats above it. Driven live by
 * the Sales Companion: as answers change, the recommended property/district,
 * the amenities and the AI's reasoning all glide into a new scene.
 */
export function LifestyleMap({
  item,
  pack,
  reasons,
  narrative,
  intentOptions,
  intentSelected,
  arrival = false,
  familyMode = false,
  investmentMode = false,
}: {
  item: InventoryItem;
  pack: IndustryPack;
  reasons: string[];
  narrative: string;
  intentOptions: { id: string; label: string; icon?: string }[];
  intentSelected: string[];
  /** Welcome view — play the cinematic "arrival" descent into the district. */
  arrival?: boolean;
  /** Family signalled — animate the walkable lifestyle radius outward. */
  familyMode?: boolean;
  /** Investment / rental signalled — reveal the growth heatmap & outlook. */
  investmentMode?: boolean;
}) {
  const [night, setNight] = useState(true);
  const [threeD, setThreeD] = useState(false);
  const [activeLayer, setActiveLayer] = useState("lifestyle");
  const mapApi = useRef<MapApi | null>(null);
  const life = item.lifestyle;
  if (!life) return null;

  const ink = night ? "text-white" : "text-zinc-900";
  const glass = night
    ? "bg-white/10 border-white/15 text-white"
    : "bg-white/70 border-white/60 text-zinc-900 shadow-xl shadow-black/5";

  return (
    <div
      className={cx(
        "relative h-screen w-screen overflow-hidden transition-colors duration-700",
        night ? "bg-[#070b14]" : "bg-[#dfe6ec]",
      )}
    >
      {/* ---- The world: real OpenStreetMap tiles; the camera flies on change ---- */}
      <RealMap
        item={item}
        night={night}
        arrival={arrival}
        familyMode={familyMode}
        investmentMode={investmentMode}
        tilt={threeD ? 62 : 0}
        apiRef={mapApi}
      />

      {/* ---------------- Floating UI (never scrolls, always above) ---------------- */}

      {/* Brand — top left */}
      <div className="absolute left-6 top-6 z-30 flex items-center gap-2.5">
        <div
          className={cx(
            "grid h-10 w-10 place-items-center rounded-2xl text-lg ring-1",
            night
              ? "bg-brand/25 text-brand ring-brand/30"
              : "bg-brand/15 text-brand ring-brand/20",
          )}
        >
          {pack.branding.logoGlyph}
        </div>
        <div>
          <div className={cx("text-base font-semibold leading-tight", ink)}>
            {pack.branding.name}
          </div>
          <div
            className={cx(
              "text-[11px]",
              night ? "text-white/50" : "text-zinc-500",
            )}
          >
            {pack.branding.tagline}
          </div>
        </div>
      </div>

      {/* Top-centre — "What matters most to you?" */}
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, ease }}
        className={cx(
          "absolute left-1/2 top-6 z-30 -translate-x-1/2 rounded-3xl border px-4 py-3 backdrop-blur-xl",
          glass,
        )}
      >
        <div className="mb-2 px-1 text-sm font-medium">
          What matters most to you?
        </div>
        <div className="flex gap-2">
          {intentOptions.map((o) => {
            const on = intentSelected.includes(o.id);
            return (
              <div
                key={o.id}
                className={cx(
                  "flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm font-medium transition-all",
                  on
                    ? "bg-brand text-white shadow-lg shadow-brand/30"
                    : night
                      ? "bg-white/5 text-white/70"
                      : "bg-black/5 text-zinc-600",
                )}
              >
                <Icon name={o.icon} className="h-4 w-4" />
                {o.label}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Top-right controls */}
      <div className="absolute right-6 top-6 z-30 flex items-center gap-2">
        <button
          onClick={() => setNight((n) => !n)}
          className={cx(
            "grid h-10 w-10 place-items-center rounded-2xl border backdrop-blur-xl transition",
            glass,
          )}
          aria-label="Toggle day and night"
        >
          {night ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div
          className={cx(
            "flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-sm font-medium backdrop-blur-xl",
            glass,
          )}
        >
          <Share2 className="h-4 w-4" /> Share
        </div>
        <div
          className={cx(
            "grid h-10 w-10 place-items-center rounded-2xl border backdrop-blur-xl",
            glass,
          )}
        >
          <Menu className="h-4 w-4" />
        </div>
      </div>

      {/* Left — preferences / district panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -24, opacity: 0 }}
          transition={{ duration: 0.6, ease }}
          className={cx(
            "absolute left-6 top-28 z-30 w-[19rem] rounded-3xl border p-5 backdrop-blur-xl",
            glass,
          )}
        >
          <div
            className={cx(
              "text-xs",
              night ? "text-white/50" : "text-zinc-500",
            )}
          >
            Based on your preferences
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">
            {life.district}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm font-medium text-brand">
            {life.tags.map((t, i) => (
              <span key={t} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-40">·</span>}
                {t}
              </span>
            ))}
          </div>
          <p
            className={cx(
              "mt-3 text-sm leading-relaxed",
              night ? "text-white/70" : "text-zinc-600",
            )}
          >
            {life.summary}
          </p>
          <div className="mt-4 space-y-2.5">
            {life.metrics.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <span
                  className={cx(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
                    night ? "bg-white/8" : "bg-black/5",
                  )}
                >
                  <Icon name={m.icon} className="h-4 w-4 text-brand" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">
                    {m.label}
                  </div>
                  <div
                    className={cx(
                      "text-xs",
                      night ? "text-white/50" : "text-zinc-500",
                    )}
                  >
                    {m.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand">
            See full lifestyle report <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Right — investment outlook (only when investment/rental is signalled) */}
      <AnimatePresence>
        {investmentMode && (
          <InvestmentOutlook item={item} glass={glass} night={night} />
        )}
      </AnimatePresence>

      {/* Right — layer rail */}
      <div className="absolute right-6 top-1/2 z-30 -translate-y-1/2">
        <div
          className={cx(
            "flex flex-col gap-1 rounded-3xl border p-1.5 backdrop-blur-xl",
            glass,
          )}
        >
          {LAYERS.map((l) => {
            const on = l.id === activeLayer;
            return (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={cx(
                  "flex w-16 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-medium transition",
                  on
                    ? "bg-brand text-white"
                    : night
                      ? "text-white/60 hover:bg-white/5"
                      : "text-zinc-500 hover:bg-black/5",
                )}
              >
                <Icon name={l.icon} className="h-5 w-5" />
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right-bottom — camera controls */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col items-center gap-2">
        <div
          className={cx(
            "grid h-9 w-9 place-items-center rounded-full border backdrop-blur-xl",
            glass,
          )}
        >
          <Diamond className="h-4 w-4" />
        </div>
        <button
          onClick={() => setThreeD((v) => !v)}
          className={cx(
            "grid h-9 w-9 place-items-center rounded-full border text-xs font-semibold backdrop-blur-xl transition",
            threeD ? "bg-brand text-white" : glass,
          )}
          aria-label="Toggle 3D tilt"
        >
          {threeD ? "3D" : "2D"}
        </button>
        <div
          className={cx(
            "flex flex-col overflow-hidden rounded-full border backdrop-blur-xl",
            glass,
          )}
        >
          <button
            onClick={() => mapApi.current?.zoomIn()}
            className="grid h-9 w-9 place-items-center border-b border-white/10 transition hover:bg-white/10"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => mapApi.current?.zoomOut()}
            className="grid h-9 w-9 place-items-center transition hover:bg-white/10"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom-centre — "Why we recommend this area" */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, ease }}
        className={cx(
          "absolute bottom-6 left-1/2 z-30 w-[42rem] max-w-[calc(100vw-3rem)] -translate-x-1/2 rounded-3xl border p-5 backdrop-blur-xl",
          glass,
        )}
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-brand">
              <Sparkles className="h-4 w-4" /> Why we recommend this area
            </div>
            <p
              className={cx(
                "text-sm leading-relaxed",
                night ? "text-white/80" : "text-zinc-700",
              )}
            >
              {shorten(narrative)}
            </p>
            <button className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand">
              Tell me more <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex shrink-0 gap-2">
            {life.headline.map((h) => (
              <div
                key={h.label}
                className={cx(
                  "w-24 rounded-2xl px-3 py-2.5 text-center",
                  night ? "bg-white/8" : "bg-black/5",
                )}
              >
                <Icon
                  name={h.icon}
                  className="mx-auto mb-1 h-5 w-5 text-brand"
                />
                <div className="text-[13px] font-semibold leading-tight">
                  {h.label}
                </div>
                <div
                  className={cx(
                    "text-[11px]",
                    night ? "text-white/50" : "text-zinc-500",
                  )}
                >
                  {h.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom-left — AI Guide */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, ease }}
        className={cx(
          "absolute bottom-6 left-6 z-30 flex items-center gap-3 rounded-full border p-2 pr-3 backdrop-blur-xl",
          glass,
        )}
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-soft text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">AI Guide</div>
          <div
            className={cx(
              "text-xs",
              night ? "text-white/50" : "text-zinc-500",
            )}
          >
            Tap to ask me anything
          </div>
        </div>
        <div className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-brand text-white">
          <AudioLines className="h-4 w-4" />
        </div>
      </motion.div>
    </div>
  );
}

/** The investment thesis for the current property, in numbers. */
function InvestmentOutlook({
  item,
  glass,
  night,
}: {
  item: InventoryItem;
  glass: string;
  night: boolean;
}) {
  const appr = item.appreciation ?? 0;
  // Straight-line the 3-yr trend out to a 5-yr projection (illustrative).
  const projected = Math.round((item.price * (1 + (appr / 100) * (5 / 3))) / 1000) * 1000;
  const yieldPct = (3.8 + appr * 0.12).toFixed(1);
  const rows: [string, string][] = [
    ["Projected 5-yr value", formatMoney(projected, item.currency)],
    ["Est. rental yield", `${yieldPct}%`],
    ["Growth trend", "Accelerating"],
  ];
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.5, ease }}
      className={cx(
        "absolute right-6 top-24 z-30 w-64 rounded-3xl border p-5 backdrop-blur-xl",
        glass,
      )}
    >
      <div className="flex items-center gap-1.5 text-sm font-semibold text-brand">
        <TrendingUp className="h-4 w-4" /> Investment outlook
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-3xl font-semibold leading-none">+{appr}%</div>
          <div
            className={cx(
              "mt-1 text-xs",
              night ? "text-white/50" : "text-zinc-500",
            )}
          >
            3-yr appreciation
          </div>
        </div>
        <Sparkline />
      </div>
      <div className="mt-4 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className={night ? "text-white/60" : "text-zinc-500"}>
              {label}
            </span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Sparkline() {
  return (
    <svg width="72" height="34" viewBox="0 0 72 34" fill="none" aria-hidden>
      <motion.path
        d="M2 30 L14 26 L26 27 L38 18 L50 14 L62 6 L70 3"
        stroke="rgb(var(--brand))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease }}
      />
      <circle cx="70" cy="3" r="2.5" fill="rgb(var(--brand))" />
    </svg>
  );
}


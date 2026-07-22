"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
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
  TrainFront,
} from "lucide-react";
import type { InventoryItem, IndustryPack, Poi } from "@/core/types";
import { formatMoney } from "@/core/engine/explain";
import { itemGradient, cx } from "@/components/ui/primitives";
import { Icon } from "@/lib/icon";
import { StylizedMap } from "./StylizedMap";

const ease = [0.22, 1, 0.36, 1] as const;

/** Keep the on-map reasoning tight — the first two sentences read from metres away. */
function shorten(text: string, sentences = 2): string {
  const parts = text.match(/[^.!?]+[.!?]+/g);
  if (!parts) return text;
  return parts.slice(0, sentences).join("").trim();
}

const POI_COLOR: Record<Poi["kind"], string> = {
  school: "text-indigo-300 bg-indigo-500/20 ring-indigo-400/30",
  park: "text-emerald-300 bg-emerald-500/20 ring-emerald-400/30",
  shopping: "text-amber-300 bg-amber-500/20 ring-amber-400/30",
  health: "text-rose-300 bg-rose-500/20 ring-rose-400/30",
  transport: "text-sky-300 bg-sky-500/20 ring-sky-400/30",
  leisure: "text-orange-300 bg-orange-500/20 ring-orange-400/30",
  water: "text-cyan-300 bg-cyan-500/20 ring-cyan-400/30",
};

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
  const [activeLayer, setActiveLayer] = useState("lifestyle");
  const life = item.lifestyle;
  if (!life) return null;

  // On arrival the world settles first, then the scene populates.
  const delayBase = arrival ? 1.7 : 0;

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
      {/* ---- The world (map + pins + property): the camera glides on change ---- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id + String(night)}
          className="absolute inset-0"
          initial={
            arrival
              ? { scale: 0.86, opacity: 0, filter: "blur(14px)" }
              : { scale: 1.12, opacity: 0.4, filter: "blur(0px)" }
          }
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: arrival ? 2.4 : 1.1, ease }}
        >
          <StylizedMap night={night} />
          <div
            className={cx(
              "absolute inset-0",
              night
                ? "bg-gradient-to-b from-black/50 via-transparent to-black/60"
                : "bg-gradient-to-b from-white/40 via-transparent to-black/10",
            )}
          />

          {/* Investment mode: growth heatmap + a ghosted future transit line */}
          {investmentMode && <HeatmapLayer delay={delayBase} />}
          {investmentMode && <FutureInfra night={night} delay={delayBase} />}

          {/* Lifestyle radius — expands outward from the property */}
          <LifestyleRadius
            at={life.at}
            night={night}
            family={familyMode}
            delay={delayBase}
          />

          {/* POIs emerge softly, staggered */}
          {life.pois.map((poi, i) => (
            <PoiPin
              key={poi.id}
              poi={poi}
              index={i}
              night={night}
              delay={delayBase}
              highlight={familyMode && (poi.kind === "school" || poi.kind === "park")}
            />
          ))}

          {/* The property rises elegantly at the centre of its radius */}
          <PropertyReveal
            item={item}
            life={life}
            night={night}
            delay={delayBase}
          />
        </motion.div>
      </AnimatePresence>

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
        <div
          className={cx(
            "grid h-9 w-9 place-items-center rounded-full border text-xs font-semibold backdrop-blur-xl",
            glass,
          )}
        >
          2D
        </div>
        <div
          className={cx(
            "flex flex-col overflow-hidden rounded-full border backdrop-blur-xl",
            glass,
          )}
        >
          <span className="grid h-9 w-9 place-items-center border-b border-white/10">
            <Plus className="h-4 w-4" />
          </span>
          <span className="grid h-9 w-9 place-items-center">
            <Minus className="h-4 w-4" />
          </span>
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

/** Soft appreciation heatmap — growth areas glow and gently pulse. */
const HOTSPOTS = [
  { x: 46, y: 43, r: 20, hot: true },
  { x: 66, y: 30, r: 13, hot: true },
  { x: 30, y: 60, r: 12, hot: false },
  { x: 73, y: 63, r: 11, hot: false },
  { x: 24, y: 26, r: 9, hot: false },
];

function HeatmapLayer({ delay }: { delay: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[6]">
      {HOTSPOTS.map((h, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: `${h.r}vw`,
            height: `${h.r}vw`,
            transform: "translate(-50%,-50%)",
            background: h.hot
              ? "radial-gradient(circle, rgba(52,211,153,0.42), rgba(245,158,11,0.14) 55%, transparent 72%)"
              : "radial-gradient(circle, rgba(245,158,11,0.30), transparent 70%)",
            filter: "blur(6px)",
          }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [0, 0.9, 0.6, 0.9], scale: [0.7, 1, 0.94, 1] }}
          transition={{
            duration: 6 + i,
            ease: "easeInOut",
            repeat: Infinity,
            delay: delay + 0.4 + i * 0.5,
          }}
        />
      ))}
    </div>
  );
}

/** "Future infrastructure fades into view" — a ghosted planned transit line. */
function FutureInfra({ night, delay }: { night: boolean; delay: number }) {
  return (
    <motion.div
      className="absolute z-[8]"
      style={{ left: "29%", top: "70%", transform: "translate(-50%,-50%)" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: [0, 0.85, 0.5, 0.85], y: 0 }}
      transition={{
        duration: 5,
        ease: "easeInOut",
        repeat: Infinity,
        delay: delay + 1,
      }}
    >
      <div
        className={cx(
          "flex items-center gap-2 rounded-full border border-dashed px-2.5 py-1.5 text-xs font-medium backdrop-blur-md",
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

function LifestyleRadius({
  at,
  night,
  family,
  delay,
}: {
  at: { x: number; y: number };
  night: boolean;
  family: boolean;
  delay: number;
}) {
  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{ left: `${at.x}%`, top: `${at.y}%`, transform: "translate(-50%,-50%)" }}
    >
      {/* The settled lifestyle radius */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: "34vw",
            height: "34vw",
            left: "50%",
            top: "50%",
            x: "-50%",
            y: "-50%",
            border: `1px solid rgb(var(--brand) / ${night ? 0.5 : 0.6})`,
            boxShadow: `0 0 60px rgb(var(--brand) / ${night ? 0.25 : 0.15}) inset`,
          }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 1, 1.06, 1], opacity: [0, 0.9, 0.7, 0.85] }}
          transition={{ duration: 1.6, ease, delay: delay + 0.3 + i * 0.15 }}
        />
      ))}

      {/* Family mode: gentle "walkable" rings pulse outward like calm sonar */}
      {family &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={`w${i}`}
            className="absolute rounded-full"
            style={{
              width: "34vw",
              height: "34vw",
              left: "50%",
              top: "50%",
              x: "-50%",
              y: "-50%",
              border: `1.5px solid rgb(var(--brand) / 0.55)`,
            }}
            initial={{ scale: 0.15, opacity: 0 }}
            animate={{ scale: [0.15, 1.05], opacity: [0.55, 0] }}
            transition={{
              duration: 4.2,
              ease: "easeOut",
              repeat: Infinity,
              delay: delay + 0.6 + i * 1.4,
            }}
          />
        ))}

      {family && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-brand/40"
          style={{ marginTop: "-9.5vw" }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 1.2, ease }}
        >
          Walkable in 15 min
        </motion.div>
      )}

      {/* Bright centre bloom */}
      <div
        className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, rgb(var(--brand) / 0.5), transparent 70%)`,
          filter: "blur(8px)",
        }}
      />
    </div>
  );
}

function PoiPin({
  poi,
  index,
  night,
  delay,
  highlight,
}: {
  poi: Poi;
  index: number;
  night: boolean;
  delay: number;
  highlight: boolean;
}) {
  return (
    <motion.div
      className="absolute z-20"
      style={{
        left: `${poi.x}%`,
        top: `${poi.y}%`,
        transform: "translate(-50%,-100%)",
      }}
      initial={{ opacity: 0, y: 10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay + 0.6 + index * 0.09, duration: 0.5, ease }}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
        className={cx(
          "flex items-center gap-2 rounded-full border px-2.5 py-1.5 backdrop-blur-xl transition-shadow",
          night
            ? "border-white/15 bg-black/40 text-white"
            : "border-white/70 bg-white/80 text-zinc-800 shadow-lg shadow-black/10",
          highlight && "ring-2 ring-brand/70",
        )}
        style={
          highlight
            ? { boxShadow: "0 0 22px rgb(var(--brand) / 0.45)" }
            : undefined
        }
      >
        <span
          className={cx(
            "grid h-6 w-6 place-items-center rounded-full ring-1",
            POI_COLOR[poi.kind],
          )}
        >
          <Icon name={poi.icon} className="h-3.5 w-3.5" />
        </span>
        <span className="pr-1 text-xs font-medium leading-tight">
          {poi.label}
          <span className={night ? "block text-white/50" : "block text-zinc-500"}>
            {poi.detail}
          </span>
        </span>
      </motion.div>
      {/* connector dot */}
      <div
        className="mx-auto mt-1 h-1.5 w-1.5 rounded-full"
        style={{ background: "rgb(var(--brand))" }}
      />
    </motion.div>
  );
}

function PropertyReveal({
  item,
  life,
  night,
  delay,
}: {
  item: InventoryItem;
  life: NonNullable<InventoryItem["lifestyle"]>;
  night: boolean;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute z-20 w-64"
      style={{
        left: `${life.at.x}%`,
        top: `${life.at.y}%`,
        transform: "translate(-50%,-50%)",
      }}
      initial={{ opacity: 0, y: 40, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay + 0.7, duration: 0.8, ease }}
    >
      <div
        className={cx(
          "overflow-hidden rounded-3xl border shadow-2xl shadow-black/50 backdrop-blur-xl",
          night ? "border-white/15 bg-black/50" : "border-white/70 bg-white/85",
        )}
      >
        <div
          className={cx(
            "relative h-28 bg-gradient-to-br",
            itemGradient(item.image),
          )}
        >
          <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white backdrop-blur">
            <Heart className="h-4 w-4" />
          </div>
        </div>
        <div className={cx("p-4", night ? "text-white" : "text-zinc-900")}>
          <div className="text-lg font-semibold leading-tight">{item.name}</div>
          <div
            className={cx(
              "text-xs",
              night ? "text-white/60" : "text-zinc-500",
            )}
          >
            {life.beds} Beds · {life.sqm} sqm
          </div>
          <div className="mt-1.5 text-lg font-semibold text-brand">
            {formatMoney(item.price, item.currency)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

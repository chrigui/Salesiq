/**
 * Motion presets are configuration, not code — the same convention
 * core/industries/*.ts uses for shipped verticals. Each preset resolves to
 * concrete, real values consumed by DisplayProfileRenderer's widget-entrance
 * animation and DisplayStage's item-presentation transition; nothing here is
 * decorative metadata that sits unused.
 */
export interface MotionConfig {
  preset: MotionPresetId;
  reduceMotion: boolean;
  /** Stage-level transition — hero swap on the live Display, item-presentation entrance. */
  transition: { durationMs: number; ease: Ease };
  /** Per-widget entrance as the composition scrolls/reveals. */
  reveal: { staggerMs: number; distancePx: number; durationMs: number };
  /** Ken Burns-style scale target applied to the Hero widget's image. 1 = no zoom. */
  imageZoom: number;
}

export type Ease = "linear" | "easeOut" | "easeInOut" | "circOut" | "backOut";

export type MotionPresetId =
  | "Cinematic"
  | "Elegant"
  | "Luxury"
  | "Modern"
  | "Dynamic"
  | "Minimal"
  | "Presentation"
  | "Custom";

export const MOTION_PRESET_IDS: MotionPresetId[] = [
  "Cinematic",
  "Elegant",
  "Luxury",
  "Modern",
  "Dynamic",
  "Minimal",
  "Presentation",
  "Custom",
];

export const MOTION_PRESET_LABELS: Record<MotionPresetId, string> = {
  Cinematic: "Cinematic",
  Elegant: "Elegant",
  Luxury: "Luxury",
  Modern: "Modern",
  Dynamic: "Dynamic",
  Minimal: "Minimal",
  Presentation: "Presentation",
  Custom: "Custom",
};

export const MOTION_PRESET_BLURBS: Record<MotionPresetId, string> = {
  Cinematic: "Slow, dramatic reveals — long holds, generous stagger",
  Elegant: "Refined and unhurried, moderate pacing",
  Luxury: "Minimal movement, deliberate stagger, restrained",
  Modern: "Crisp and snappy, quick reveals",
  Dynamic: "Energetic, fast-paced, punchy easing",
  Minimal: "Near-instant, barely-there motion",
  Presentation: "Deliberate, presenter-paced holds",
  Custom: "Fully manual — every value editable below",
};

const PRESETS: Record<Exclude<MotionPresetId, "Custom">, Omit<MotionConfig, "preset" | "reduceMotion">> = {
  Cinematic: {
    transition: { durationMs: 1200, ease: "easeOut" },
    reveal: { staggerMs: 150, distancePx: 40, durationMs: 900 },
    imageZoom: 1.08,
  },
  Elegant: {
    transition: { durationMs: 800, ease: "easeInOut" },
    reveal: { staggerMs: 100, distancePx: 24, durationMs: 700 },
    imageZoom: 1.04,
  },
  Luxury: {
    transition: { durationMs: 1000, ease: "easeOut" },
    reveal: { staggerMs: 200, distancePx: 16, durationMs: 800 },
    imageZoom: 1.06,
  },
  Modern: {
    transition: { durationMs: 400, ease: "easeOut" },
    reveal: { staggerMs: 60, distancePx: 12, durationMs: 400 },
    imageZoom: 1.0,
  },
  Dynamic: {
    transition: { durationMs: 300, ease: "backOut" },
    reveal: { staggerMs: 40, distancePx: 20, durationMs: 350 },
    imageZoom: 1.1,
  },
  Minimal: {
    transition: { durationMs: 250, ease: "linear" },
    reveal: { staggerMs: 20, distancePx: 8, durationMs: 250 },
    imageZoom: 1.0,
  },
  Presentation: {
    transition: { durationMs: 900, ease: "easeInOut" },
    reveal: { staggerMs: 120, distancePx: 28, durationMs: 750 },
    imageZoom: 1.05,
  },
};

const DEFAULT_PRESET: Exclude<MotionPresetId, "Custom"> = "Cinematic";

/** Resolves a profile's stored motion Json (possibly partial/legacy — PR1 only ever stored `{preset}`) into a complete, concrete MotionConfig every consumer can rely on. */
export function resolveMotionConfig(stored: unknown): MotionConfig {
  const raw = (stored && typeof stored === "object" ? stored : {}) as Partial<MotionConfig> & { preset?: string };
  const preset: MotionPresetId = MOTION_PRESET_IDS.includes(raw.preset as MotionPresetId)
    ? (raw.preset as MotionPresetId)
    : DEFAULT_PRESET;

  if (preset === "Custom") {
    const base = PRESETS[DEFAULT_PRESET];
    return {
      preset,
      reduceMotion: raw.reduceMotion ?? false,
      transition: { ...base.transition, ...raw.transition },
      reveal: { ...base.reveal, ...raw.reveal },
      imageZoom: raw.imageZoom ?? base.imageZoom,
    };
  }

  return { preset, reduceMotion: raw.reduceMotion ?? false, ...PRESETS[preset] };
}

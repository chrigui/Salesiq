/**
 * Deep brand theming (Customer Display Experience, Theme-PR1) — configuration,
 * not code, same convention as motionPresets.ts. Each enum resolves to
 * concrete CSS values consumed by BrandTokenScope; nothing here is
 * decorative metadata that sits unused.
 */
export type BrandBorderRadius = "Sharp" | "Soft" | "Round";
export type BrandShadowIntensity = "Flat" | "Subtle" | "Elevated";
export type BrandSpacingScale = "Compact" | "Comfortable" | "Spacious";
export type BrandHeadingWeight = "Regular" | "Medium" | "Semibold" | "Bold";
export type BrandLetterSpacing = "Tight" | "Normal" | "Wide";

export interface BrandTokens {
  /** Border radius for large surfaces (cards, sheets) — today's hardcoded rounded-3xl. */
  radius: string;
  /** Border radius for small surfaces (buttons, badges) — today's hardcoded rounded-2xl. */
  radiusSm: string;
  /** box-shadow value — today's hardcoded shadow-2xl shadow-black/40. */
  shadow: string;
  /** Spacing multiplier, as a bare number string usable in calc(var(--space-unit) * Nrem). */
  spaceUnit: string;
  /** CSS font-weight for heading elements. */
  headingWeight: string;
  /** CSS letter-spacing for heading elements. */
  letterSpacingHeading: string;
}

const BORDER_RADIUS_IDS: BrandBorderRadius[] = ["Sharp", "Soft", "Round"];
const SHADOW_INTENSITY_IDS: BrandShadowIntensity[] = ["Flat", "Subtle", "Elevated"];
const SPACING_SCALE_IDS: BrandSpacingScale[] = ["Compact", "Comfortable", "Spacious"];
const HEADING_WEIGHT_IDS: BrandHeadingWeight[] = ["Regular", "Medium", "Semibold", "Bold"];
const LETTER_SPACING_IDS: BrandLetterSpacing[] = ["Tight", "Normal", "Wide"];

const DEFAULT_BORDER_RADIUS: BrandBorderRadius = "Soft";
const DEFAULT_SHADOW_INTENSITY: BrandShadowIntensity = "Elevated";
const DEFAULT_SPACING_SCALE: BrandSpacingScale = "Comfortable";
const DEFAULT_HEADING_WEIGHT: BrandHeadingWeight = "Semibold";
const DEFAULT_LETTER_SPACING: BrandLetterSpacing = "Normal";

const RADIUS: Record<BrandBorderRadius, { radius: string; radiusSm: string }> = {
  Sharp: { radius: "0.5rem", radiusSm: "0.375rem" },
  Soft: { radius: "1.5rem", radiusSm: "1rem" },
  Round: { radius: "2.5rem", radiusSm: "9999px" },
};

const SHADOW: Record<BrandShadowIntensity, string> = {
  Flat: "none",
  Subtle: "0 10px 30px -10px rgb(0 0 0 / 0.25)",
  Elevated: "0 25px 50px -12px rgb(0 0 0 / 0.4)",
};

const SPACING: Record<BrandSpacingScale, string> = {
  Compact: "0.85",
  Comfortable: "1",
  Spacious: "1.2",
};

const HEADING_WEIGHT: Record<BrandHeadingWeight, string> = {
  Regular: "400",
  Medium: "500",
  Semibold: "600",
  Bold: "700",
};

const LETTER_SPACING: Record<BrandLetterSpacing, string> = {
  Tight: "-0.01em",
  Normal: "normal",
  Wide: "0.02em",
};

/**
 * Resolves a brand kit's stored (possibly absent/legacy) style fields into a
 * complete, concrete BrandTokens every consumer can rely on. Mirrors
 * motionPresets.ts's resolveMotionConfig() resolve-with-fallback pattern:
 * an unset or unrecognized value always falls back to today's exact look,
 * never a fabricated one.
 */
export function resolveBrandTokens(brand?: {
  borderRadius?: string | null;
  shadowIntensity?: string | null;
  spacingScale?: string | null;
  headingWeight?: string | null;
  letterSpacing?: string | null;
} | null): BrandTokens {
  const borderRadius = BORDER_RADIUS_IDS.includes(brand?.borderRadius as BrandBorderRadius)
    ? (brand!.borderRadius as BrandBorderRadius)
    : DEFAULT_BORDER_RADIUS;
  const shadowIntensity = SHADOW_INTENSITY_IDS.includes(brand?.shadowIntensity as BrandShadowIntensity)
    ? (brand!.shadowIntensity as BrandShadowIntensity)
    : DEFAULT_SHADOW_INTENSITY;
  const spacingScale = SPACING_SCALE_IDS.includes(brand?.spacingScale as BrandSpacingScale)
    ? (brand!.spacingScale as BrandSpacingScale)
    : DEFAULT_SPACING_SCALE;
  const headingWeight = HEADING_WEIGHT_IDS.includes(brand?.headingWeight as BrandHeadingWeight)
    ? (brand!.headingWeight as BrandHeadingWeight)
    : DEFAULT_HEADING_WEIGHT;
  const letterSpacing = LETTER_SPACING_IDS.includes(brand?.letterSpacing as BrandLetterSpacing)
    ? (brand!.letterSpacing as BrandLetterSpacing)
    : DEFAULT_LETTER_SPACING;

  return {
    ...RADIUS[borderRadius],
    shadow: SHADOW[shadowIntensity],
    spaceUnit: SPACING[spacingScale],
    headingWeight: HEADING_WEIGHT[headingWeight],
    letterSpacingHeading: LETTER_SPACING[letterSpacing],
  };
}

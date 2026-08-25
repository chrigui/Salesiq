/**
 * Curated font allowlist for deep brand theming (Theme-PR2) — never a
 * freeform font-family string. `BrandProfile.fontHeading`/`fontBody` store
 * one of these ids; the Google Fonts stylesheet URL is only ever built from
 * the allowlisted `googleFamily` segment below, never from user input.
 */
export interface FontOption {
  id: string;
  label: string;
  /** Exact family name as Google Fonts expects it in the CSS `font-family` value. */
  family: string;
  /** URL-safe family segment for the Google Fonts stylesheet request (spaces as "+"). */
  googleFamily: string;
  /** Real fallback stack — the family always renders acceptably even if the stylesheet fails to load. */
  fallback: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "inter",
    label: "Inter",
    family: "Inter",
    googleFamily: "Inter:wght@400;500;600;700",
    fallback: "ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "manrope",
    label: "Manrope",
    family: "Manrope",
    googleFamily: "Manrope:wght@400;500;600;700",
    fallback: "ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "sora",
    label: "Sora",
    family: "Sora",
    googleFamily: "Sora:wght@400;500;600;700",
    fallback: "ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    family: "Playfair Display",
    googleFamily: "Playfair+Display:wght@400;600;700",
    fallback: "Georgia, 'Times New Roman', serif",
  },
  {
    id: "cormorant",
    label: "Cormorant Garamond",
    family: "Cormorant Garamond",
    googleFamily: "Cormorant+Garamond:wght@400;500;600;700",
    fallback: "Georgia, 'Times New Roman', serif",
  },
  {
    id: "dm-serif",
    label: "DM Serif Display",
    family: "DM Serif Display",
    googleFamily: "DM+Serif+Display:wght@400",
    fallback: "Georgia, 'Times New Roman', serif",
  },
];

export const FONT_OPTION_IDS = FONT_OPTIONS.map((f) => f.id) as [string, ...string[]];

export function getFontOption(id: string | null | undefined): FontOption | null {
  if (!id) return null;
  return FONT_OPTIONS.find((f) => f.id === id) ?? null;
}

/** CSS `font-family` value with a real fallback stack — safe to use directly in a style prop. */
export function fontStack(id: string | null | undefined): string | null {
  const option = getFontOption(id);
  if (!option) return null;
  return `'${option.family}', ${option.fallback}`;
}

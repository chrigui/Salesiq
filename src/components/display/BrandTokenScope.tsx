"use client";

import type { CSSProperties, ReactNode } from "react";
import { resolveBrandTokens } from "@/core/display/brandTokens";
import { fontStack } from "@/core/display/brandFonts";
import { BrandFontsLoader } from "./BrandFontsLoader";

export interface BrandTokenInput {
  brand?: string | null;
  brandSoft?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  borderRadius?: string | null;
  shadowIntensity?: string | null;
  spacingScale?: string | null;
  fontHeading?: string | null;
  fontBody?: string | null;
}

/**
 * Scopes a subtree to a brand kit's CSS custom properties — generalizes the
 * --brand/--brand-soft pattern DisplayProfileRenderer.tsx already applied
 * inline, so both it and the whole-Display default-brand wrapper (Theme-PR3)
 * share one implementation instead of two slightly different ones. Colors
 * are only set when the brand actually specifies them (an absent color
 * leaves the ambient CSS variable — and whatever it was already scoped to —
 * untouched, rather than forcing a value); radius/shadow/spacing always
 * resolve to a concrete value via resolveBrandTokens()'s fallback, so an
 * unthemed brand still renders identically to today.
 */
export function BrandTokenScope({
  brand,
  className,
  children,
}: {
  brand?: BrandTokenInput | null;
  className?: string;
  children: ReactNode;
}) {
  const tokens = resolveBrandTokens(brand);
  const headingFont = fontStack(brand?.fontHeading);
  const bodyFont = fontStack(brand?.fontBody);

  const style: CSSProperties = {
    ...(brand?.brand ? { "--brand": brand.brand } : {}),
    ...(brand?.brandSoft ? { "--brand-soft": brand.brandSoft } : {}),
    ...(brand?.backgroundColor ? { "--bg": brand.backgroundColor } : {}),
    ...(brand?.textColor ? { "--text": brand.textColor } : {}),
    ...(headingFont ? { "--font-heading": headingFont } : {}),
    ...(bodyFont ? { "--font-body": bodyFont, fontFamily: bodyFont } : {}),
    "--radius": tokens.radius,
    "--radius-sm": tokens.radiusSm,
    "--shadow-color": tokens.shadow,
    "--space-unit": tokens.spaceUnit,
  } as CSSProperties;

  return (
    <div style={style} className={className} data-brand-scope="true">
      <BrandFontsLoader fontHeading={brand?.fontHeading} fontBody={brand?.fontBody} />
      {children}
    </div>
  );
}

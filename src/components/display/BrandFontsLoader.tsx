"use client";

import { useEffect } from "react";
import { getFontOption } from "@/core/display/brandFonts";

const injectedHrefs = new Set<string>();

/**
 * Injects the Google Fonts stylesheet <link> for a brand's chosen heading/
 * body fonts — only ever built from the allowlisted googleFamily segment
 * (see brandFonts.ts), never from arbitrary input. A no-op when neither is
 * set. Safe to mount alongside multiple BrandTokenScope instances on one
 * page — hrefs are deduped process-wide so the same family is never
 * requested twice.
 */
export function BrandFontsLoader({
  fontHeading,
  fontBody,
}: {
  fontHeading?: string | null;
  fontBody?: string | null;
}) {
  useEffect(() => {
    for (const id of [fontHeading, fontBody]) {
      const option = getFontOption(id);
      if (!option) continue;
      const href = `https://fonts.googleapis.com/css2?family=${option.googleFamily}&display=swap`;
      if (injectedHrefs.has(href)) continue;
      injectedHrefs.add(href);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }, [fontHeading, fontBody]);

  return null;
}

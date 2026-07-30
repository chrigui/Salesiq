import type { Metadata } from "next";

const SITE_NAME = "SalesIQ";
const SITE_URL = "https://www.salesiq.ai";
const DEFAULT_DESCRIPTION =
  "SalesIQ is the Decision Intelligence platform for enterprise sales teams: guided selling, explainable AI, and a decision engine that shows its work on every recommendation.";

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
}: {
  title: string;
  description?: string;
  path: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      // No explicit `images` here — each route has its own
      // opengraph-image.tsx (file convention), which Next.js wires up
      // automatically. Setting both risks duplicate og:image tags.
      title: `${title} — ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${SITE_NAME}`,
      description,
    },
  };
}

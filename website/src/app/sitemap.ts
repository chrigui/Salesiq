import type { MetadataRoute } from "next";

const SITE_URL = "https://www.salesiq.ai";

// Only the pages actually live this phase — see nav-config.ts for the
// full eventual sitemap. Add an entry here when a page's status flips
// from "planned" to "live".
const ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/platform", priority: 0.9 },
  { path: "/decision-intelligence", priority: 0.9 },
  { path: "/pricing", priority: 0.8 },
  { path: "/demo", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority,
  }));
}

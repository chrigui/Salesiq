import type { MetadataRoute } from "next";

/**
 * Mobile Apps (Module 12 · Future Platform) — a real, installable PWA
 * rather than a native app store listing this pilot can't ship. Next.js
 * serves this at /manifest.webmanifest automatically; combined with the
 * apple-touch-icon in the root layout, the Sales Companion can genuinely
 * be added to a phone's home screen and launched full-screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SalesIQ Sales Companion",
    short_name: "SalesIQ",
    description: "Guide a customer through a decision, from your phone.",
    start_url: "/companion",
    display: "standalone",
    background_color: "#0a0f1c",
    theme_color: "#18181b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
  };
}

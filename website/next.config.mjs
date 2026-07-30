import { fileURLToPath } from "node:url";

// The 5 real product surfaces this site doesn't own — see
// src/app in the repo root. Proxied straight through to the product app's
// own deployment so they keep working at their existing URLs once this
// site takes over the root domain. `/api/demo-request` is deliberately not
// listed: it's a real route in *this* app, and Next.js always checks this
// app's own filesystem routes before falling through to a rewrite, so it's
// never shadowed by the broader `/api/:path*` entry below.
const PRODUCT_APP_PATHS = ["display", "companion", "dashboard", "admin", "continue", "api"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives in a subdirectory of a repo that also has its own
  // lockfile (the product app's) — pin the tracing root explicitly so
  // Next doesn't guess and warn about which lockfile is authoritative.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  async rewrites() {
    if (!process.env.PRODUCT_APP_URL) return [];
    const base = process.env.PRODUCT_APP_URL.replace(/\/$/, "");
    return PRODUCT_APP_PATHS.flatMap((p) => [
      { source: `/${p}`, destination: `${base}/${p}` },
      { source: `/${p}/:path*`, destination: `${base}/${p}/:path*` },
    ]);
  },
};

export default nextConfig;

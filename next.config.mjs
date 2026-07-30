/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  // Multi-zone setup: the marketing site (website/) owns the root domain
  // and proxies /display, /companion, /dashboard, /admin, /continue, /api/*
  // to this app's own deployment via rewrites — see website/next.config.mjs
  // and website/README.md for the full picture. When this app is reached
  // through that proxy, the browser resolves the page's own `_next/static`
  // asset URLs against the *proxying* domain, not this one — assetPrefix
  // fixes that by making every asset URL absolute, pointing straight back
  // at this deployment regardless of which domain served the HTML.
  // No-ops (undefined) when PRODUCT_APP_URL isn't set, e.g. local dev.
  assetPrefix: process.env.PRODUCT_APP_URL || undefined,
};

export default nextConfig;

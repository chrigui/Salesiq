import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives in a subdirectory of a repo that also has its own
  // lockfile (the product app's) — pin the tracing root explicitly so
  // Next doesn't guess and warn about which lockfile is authoritative.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
};

export default nextConfig;

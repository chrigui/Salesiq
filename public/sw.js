/**
 * Companion PWA service worker — scoped to /companion only (see
 * registration in CompanionInstallPrompt.tsx). Its only job is to make the
 * Companion genuinely installable and resilient to a flaky connection, not
 * to run a full offline app: only the shell (the page itself + its static
 * manifest/icons) is cached. Everything else — API calls, other routes —
 * goes straight to the network untouched, since session/lead/proposal data
 * is live and must never be served stale from a cache.
 */
const CACHE = "salesiq-companion-shell-v1";
const SHELL_URLS = [
  "/companion",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => {
        /* best-effort precache — a miss here just means no offline fallback yet */
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !SHELL_URLS.includes(url.pathname)) return;

  // Network-first: always prefer a fresh shell, fall back to the cache only
  // when the network is unavailable (offline, or mid-reconnect).
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});

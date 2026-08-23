import "server-only";
import dns from "node:dns/promises";
import net from "node:net";
import * as cheerio from "cheerio";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 3 * 1024 * 1024; // 3MB — plenty for a marketing page's HTML
const MAX_IMAGES = 40;
const MAX_REDIRECTS = 3;

// Real-estate marketing sites almost never serve their slideshow/gallery
// images as a plain <img src>: the real photo usually sits behind a
// lazy-load placeholder (one of these data-* attributes), a responsive
// srcset (where the *largest* candidate — not the first — is the real
// photo), or a CSS background-image on a slide/hero <div> rather than an
// <img> at all. Missing all three was the actual bug: a first pass that
// only read <img src> and og:image silently skipped exactly the "large
// slideshow/background" images this feature exists to collect.
const LAZY_SRC_ATTRS = [
  "data-src",
  "data-lazy-src",
  "data-lazysrc",
  "data-original",
  "data-full",
  "data-full-src",
  "data-large",
  "data-hi-res-src",
  "data-image",
  "data-bg",
  "data-background",
  "data-background-image",
];
const BG_URL_RE = /background(?:-image)?\s*:\s*url\(\s*(['"]?)(.*?)\1\s*\)/gi;

export interface FetchedWebsiteContent {
  title: string;
  description: string;
  images: string[];
}

export class WebsiteFetchError extends Error {
  constructor(
    message: string,
    public code: "invalid-url" | "blocked-host" | "fetch-failed" | "unsupported-content" | "too-large",
  ) {
    super(message);
    this.name = "WebsiteFetchError";
  }
}

function isPrivateIpv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  return false;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIP(ip) === 4) return isPrivateIpv4(ip);
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("::ffff:")) return isPrivateIpv4(lower.slice("::ffff:".length));
    return false;
  }
  return true; // not a parseable IP — treat as unsafe
}

/**
 * SSRF guard: this fetches a URL an admin typed into a form, so before the
 * real request goes out we resolve the hostname and reject anything that
 * points at loopback/private/link-local space (internal services, cloud
 * metadata endpoints). Re-run on every redirect hop in fetchWebsiteContent
 * below — a first-hop-only check would let a public URL 302 to an internal
 * one.
 */
async function assertPublicHost(hostname: string): Promise<void> {
  if (hostname === "localhost") throw new WebsiteFetchError("That address isn't reachable.", "blocked-host");
  const literal = net.isIP(hostname);
  if (literal) {
    if (isPrivateIp(hostname)) throw new WebsiteFetchError("That address isn't reachable.", "blocked-host");
    return;
  }
  let addresses: string[];
  try {
    addresses = (await dns.lookup(hostname, { all: true })).map((a) => a.address);
  } catch {
    throw new WebsiteFetchError("Couldn't resolve that address.", "blocked-host");
  }
  if (addresses.length === 0 || addresses.some(isPrivateIp)) {
    throw new WebsiteFetchError("That address isn't reachable.", "blocked-host");
  }
}

async function readBounded(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel().catch(() => {});
      throw new WebsiteFetchError("That page is too large to import.", "too-large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function resolveImageUrl(src: string | undefined | null, base: string): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  try {
    const abs = new URL(trimmed, base);
    if (abs.protocol !== "http:" && abs.protocol !== "https:") return null;
    return abs.toString();
  } catch {
    return null;
  }
}

/** From a srcset list ("a.jpg 320w, b.jpg 1024w" or "a.jpg 1x, b.jpg 2x"), the highest-resolution candidate — that's reliably the real photo, where the bare `src` is often a small lazy-load placeholder. */
function largestFromSrcset(srcset: string | undefined | null): string | undefined {
  if (!srcset) return undefined;
  let best: { url: string; score: number } | null = null;
  for (const entry of srcset.split(",")) {
    const [url, descriptor] = entry.trim().split(/\s+/, 2);
    if (!url) continue;
    const score = descriptor?.endsWith("w")
      ? parseInt(descriptor, 10) || 0
      : descriptor?.endsWith("x")
        ? (parseFloat(descriptor) || 1) * 1000 // density descriptor — scaled so it still compares sensibly against width descriptors
        : 0;
    if (!best || score > best.score) best = { url, score };
  }
  return best?.url;
}

/** Every url(...) inside an inline `style` attribute — covers the common page-builder pattern of a slide/hero <div style="background-image:url(...)"> with no <img> at all. */
function backgroundImageUrls(style: string | undefined): string[] {
  if (!style) return [];
  const urls: string[] = [];
  for (const match of style.matchAll(BG_URL_RE)) urls.push(match[2]);
  return urls;
}

/** Every <script type="application/ld+json"> block on the page, parsed best-effort (a site with malformed JSON-LD just contributes nothing, rather than failing the whole fetch). */
function readJsonLd($: cheerio.CheerioAPI): unknown[] {
  const blocks: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      // malformed JSON-LD — skip, best effort only
    }
  });
  return blocks;
}

/** Best-effort walk of a JSON-LD block for schema.org "image" values (string, or array of strings/ImageObject) — common on real-estate listing pages for SEO, and often the site's own curated gallery list. */
function jsonLdImageUrls(json: unknown, depth = 0): string[] {
  if (depth > 6 || json === null || typeof json !== "object") return [];
  const urls: string[] = [];
  const record = json as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (key === "image") {
      const candidates = Array.isArray(value) ? value : [value];
      for (const c of candidates) {
        if (typeof c === "string") urls.push(c);
        else if (c && typeof c === "object" && typeof (c as Record<string, unknown>).url === "string") {
          urls.push((c as Record<string, unknown>).url as string);
        }
      }
    } else if (Array.isArray(value)) {
      for (const v of value) urls.push(...jsonLdImageUrls(v, depth + 1));
    } else if (value && typeof value === "object") {
      urls.push(...jsonLdImageUrls(value, depth + 1));
    }
  }
  return urls;
}

/**
 * Fetches a project's marketing website and extracts what the Inventory
 * Builder's "Fetch & fill" action uses: a title, a short description, and
 * real image URLs found on the page — og:image and JSON-LD first, then
 * every <img>/<source>'s largest srcset candidate, lazy-load data-*
 * attributes, and CSS background-image on any element, since a real
 * marketing site's slideshow/gallery photos are rarely a plain <img src>.
 * Deduped, capped at MAX_IMAGES — never fabricated, only what the page
 * itself actually contains.
 */
export async function fetchWebsiteContent(rawUrl: string, redirectsLeft = MAX_REDIRECTS): Promise<FetchedWebsiteContent> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new WebsiteFetchError("That doesn't look like a valid URL.", "invalid-url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new WebsiteFetchError("Only http/https URLs are supported.", "invalid-url");
  }

  await assertPublicHost(url.hostname);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SalesIQBot/1.0)" },
    });
  } catch {
    throw new WebsiteFetchError("Couldn't reach that site.", "fetch-failed");
  } finally {
    clearTimeout(timeout);
  }

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location || redirectsLeft <= 0) {
      throw new WebsiteFetchError("Too many redirects.", "fetch-failed");
    }
    return fetchWebsiteContent(new URL(location, url).toString(), redirectsLeft - 1);
  }
  if (!res.ok) {
    throw new WebsiteFetchError(`The site responded with an error (${res.status}).`, "fetch-failed");
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new WebsiteFetchError("That URL isn't a web page.", "unsupported-content");
  }

  const html = await readBounded(res);
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").first().text().trim() ||
    "";

  const description =
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    "";

  const images: string[] = [];
  const seen = new Set<string>();
  const pushImage = (src: string | undefined | null) => {
    if (images.length >= MAX_IMAGES) return;
    const abs = resolveImageUrl(src, url.toString());
    if (abs && !seen.has(abs)) {
      seen.add(abs);
      images.push(abs);
    }
  };

  pushImage($('meta[property="og:image"]').attr("content"));
  for (const jsonLdBlock of readJsonLd($)) {
    for (const imgUrl of jsonLdImageUrls(jsonLdBlock)) pushImage(imgUrl);
  }

  $("img, source").each((_, el) => {
    const node = $(el);
    // The largest srcset candidate wins over the bare src, which is
    // frequently just a small lazy-load placeholder.
    pushImage(largestFromSrcset(node.attr("srcset") ?? node.attr("data-srcset")) ?? node.attr("src"));
    for (const attr of LAZY_SRC_ATTRS) pushImage(node.attr(attr));
  });

  $("[style]").each((_, el) => {
    for (const bg of backgroundImageUrls($(el).attr("style"))) pushImage(bg);
  });
  for (const attr of LAZY_SRC_ATTRS.filter((a) => a.includes("bg") || a.includes("background"))) {
    $(`[${attr}]`).each((_, el) => pushImage($(el).attr(attr)));
  }

  return { title, description, images };
}

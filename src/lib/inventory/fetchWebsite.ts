import "server-only";
import dns from "node:dns/promises";
import net from "node:net";
import * as cheerio from "cheerio";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 3 * 1024 * 1024; // 3MB — plenty for a marketing page's HTML
const MAX_IMAGES = 12;
const MAX_REDIRECTS = 3;

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

function resolveImageUrl(src: string | undefined, base: string): string | null {
  if (!src) return null;
  if (src.startsWith("data:")) return null;
  try {
    const abs = new URL(src, base);
    if (abs.protocol !== "http:" && abs.protocol !== "https:") return null;
    return abs.toString();
  } catch {
    return null;
  }
}

/**
 * Fetches a project's marketing website and extracts what the Inventory
 * Builder's "Fetch & fill" action uses: a title, a short description, and a
 * handful of real image URLs found on the page (OG image first, then plain
 * <img> tags, deduped, capped at MAX_IMAGES) — never fabricated, only what
 * the page itself actually contains.
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
  const pushImage = (src: string | undefined) => {
    const abs = resolveImageUrl(src, url.toString());
    if (abs && !seen.has(abs)) {
      seen.add(abs);
      images.push(abs);
    }
  };
  pushImage($('meta[property="og:image"]').attr("content"));
  $("img").each((_, el) => {
    if (images.length >= MAX_IMAGES) return;
    pushImage($(el).attr("src"));
  });

  return { title, description, images: images.slice(0, MAX_IMAGES) };
}

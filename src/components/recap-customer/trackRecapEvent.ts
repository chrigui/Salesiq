"use client";

/**
 * The same sendBeacon-with-fetch-fallback pattern SharedExperienceView.tsx
 * and BrochureView.tsx already use for their own public event routes —
 * fire-and-forget, safe to call from an unmount-bound page navigation.
 */
export function trackRecapEvent(
  code: string,
  kind: "View" | "PropertyView" | "GalleryView" | "PaymentView" | "InvestmentView" | "ComparisonView" | "ContactClick",
  itemId?: string,
  meta?: Record<string, unknown>,
) {
  const body = JSON.stringify({ kind, itemId, meta });
  const url = `/api/public/recaps/${code}/events`;
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
  } else {
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(
      () => {},
    );
  }
}

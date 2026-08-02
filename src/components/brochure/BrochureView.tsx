"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Printer } from "lucide-react";
import { cx } from "@/components/ui/primitives";
import { WIDGET_REGISTRY } from "./registry";
import type {
  BrochureAssetMeta,
  BrochurePackSummary,
  BrochureTemplate,
  BrochureWidgetContext,
} from "./types";
import type { BrochureSection } from "@/lib/serializers/brochure";
import type { InventoryItem } from "@/core/types";

export interface BrochureViewProps {
  slug: string;
  item: InventoryItem;
  pack: BrochurePackSummary;
  comparables: InventoryItem[];
  assets: BrochureAssetMeta[];
  template: BrochureTemplate;
  theme: "Light" | "Dark" | "Auto" | "Brand";
  sections: BrochureSection[];
  isPreview: boolean;
}

function beacon(url: string, body: unknown) {
  const payload = new Blob([JSON.stringify(body)], { type: "application/json" });
  if (navigator.sendBeacon) navigator.sendBeacon(url, payload);
  else fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true });
}

export function BrochureView({
  slug,
  item,
  pack,
  comparables,
  assets,
  template,
  theme,
  sections,
  isPreview,
}: BrochureViewProps) {
  const [autoDark, setAutoDark] = useState(false);

  useEffect(() => {
    if (theme !== "Auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setAutoDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setAutoDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const dark = theme === "Dark" || (theme === "Auto" && autoDark);

  useEffect(() => {
    if (isPreview) return; // previewing your own brochure doesn't count as a real visit
    const params = new URLSearchParams(window.location.search);
    const kind = params.get("src") === "qr" ? "Scan" : "View";
    beacon(`/api/public/brochures/${slug}/events`, { kind });
  }, [slug, isPreview]);

  const trackClick = (via: string) => {
    if (isPreview) return;
    beacon(`/api/public/brochures/${slug}/events`, { kind: "Click", meta: { via } });
  };

  const ctx: BrochureWidgetContext = useMemo(
    () => ({
      slug,
      item,
      pack,
      comparables,
      assets,
      dark,
      template,
      locale: "en",
      onTrackClick: trackClick,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug, item, pack, comparables, assets, dark, template],
  );

  const enabled = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const brandVars = {
    "--brand": pack.branding.brand,
    "--brand-soft": pack.branding.brandSoft,
  } as CSSProperties;

  return (
    <div
      style={brandVars}
      className={cx(
        "min-h-screen",
        dark ? "bg-zinc-950" : "bg-white",
        template === "Luxury" && "font-serif",
      )}
    >
      {isPreview && (
        <div className="sticky top-0 z-50 bg-amber-400 py-1.5 text-center text-xs font-semibold text-amber-950">
          Preview — this brochure is not published yet, visits here aren&apos;t counted
        </div>
      )}

      <div className="brochure-print">
        {enabled.map((s) => {
          const Widget = WIDGET_REGISTRY[s.type];
          if (!Widget) return null;
          return <Widget key={s.id} {...ctx} />;
        })}
      </div>

      <button
        onClick={() => window.print()}
        className={cx(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg print:hidden",
          dark ? "bg-white text-zinc-900" : "bg-zinc-900 text-white",
        )}
      >
        <Printer className="h-4 w-4" /> Download PDF
      </button>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .brochure-print section {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

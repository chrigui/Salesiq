"use client";

import { useEffect, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { ItemImage } from "@/components/ui/ItemImage";
import { formatMoney } from "@/core/engine/explain";
import { cx } from "@/components/ui/primitives";
import type { InventoryItem } from "@/core/types";

interface Branding {
  name: string;
  tagline: string;
  brand: string;
  brandSoft: string;
  logoGlyph: string;
}

function track(code: string, kind: "View" | "ItemClick" | "ProposalView", meta?: Record<string, unknown>) {
  const body = JSON.stringify({ kind, meta });
  const url = `/api/public/shared-experiences/${code}/events`;
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
  } else {
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  }
}

export function SharedExperienceView({
  code,
  branding,
  customerName,
  items,
  focusedItemId,
  proposalText,
  proposalEngine,
}: {
  code: string;
  branding: Branding;
  customerName: string | null;
  items: InventoryItem[];
  focusedItemId: string | null;
  proposalText: string | null;
  proposalEngine: string | null;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    track(code, "View");
    if (proposalText) track(code, "ProposalView");
    // Fire once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (itemId: string) => {
    const next = expanded === itemId ? null : itemId;
    setExpanded(next);
    if (next) track(code, "ItemClick", { itemId });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div style={{ "--brand": branding.brand, "--brand-soft": branding.brandSoft } as React.CSSProperties}>
        <header className="border-b border-white/10 px-6 py-8 sm:px-10">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-lg">{branding.logoGlyph}</span>
            <div>
              <div className="text-sm font-medium text-white/90">{branding.name}</div>
              <div className="text-xs text-white/50">{branding.tagline}</div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            {customerName ? `Hi ${customerName}, here's what we discussed` : "Here's what we discussed"}
          </h1>

          {proposalText && (
            <section className="mt-6 rounded-2xl border border-white/10 p-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand ring-1 ring-brand/30">
                <Sparkles className="h-3.5 w-3.5" />
                {proposalEngine === "claude+writer" ? "Authored by Claude" : "Your proposal"}
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-white/80">
                {proposalText.split(/\n\n+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
              {items.length === 1 ? "This listing" : `${items.length} listings`}
            </h2>
            <div className="space-y-3">
              {items.map((item) => {
                const isOpen = expanded === item.id;
                const isFocused = item.id === focusedItemId;
                return (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10">
                    <button
                      onClick={() => toggle(item.id)}
                      className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/[0.03]"
                    >
                      <ItemImage image={item.image} photo={item.photo} className="h-16 w-16 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{item.name}</span>
                          {isFocused && (
                            <span className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-medium text-brand">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-white/50">{formatMoney(item.price, item.currency)}</div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className={cx("border-t border-white/10 px-4 py-3", "bg-white/[0.02]")}>
                        <p className="text-sm text-white/70">{item.subtitle}</p>
                        {item.highlights.length > 0 && (
                          <ul className="mt-2 space-y-1.5">
                            {item.highlights.map((h, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" /> {h}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {items.length === 0 && (
                <p className="text-sm text-white/40">The listings in this link are no longer available.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

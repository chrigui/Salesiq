"use client";

import { useEffect, useState } from "react";
import { Check, Languages, Loader2 } from "lucide-react";
import { cx } from "@/components/ui/primitives";
import type { BrochureWidgetContext } from "../types";

interface CopyResult {
  en: { summary: string; highlights: string[] };
  ar: { summary: string; highlights: string[] } | null;
  engine: "claude+writer" | "deterministic-writer";
}

/**
 * Fetches brochure copy from /api/ai/brochure on mount — English always,
 * Arabic only when the server had an AI key to translate with (see that
 * route's doc comment). Never fabricates a translation client-side.
 */
export function Highlights({ item, pack, dark }: BrochureWidgetContext) {
  const [copy, setCopy] = useState<CopyResult | null>(null);
  const [showArabic, setShowArabic] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/brochure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId: pack.id, itemId: item.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCopy(data);
      })
      .catch(() => {
        if (!cancelled) setCopy({ en: { summary: item.subtitle, highlights: item.highlights }, ar: null, engine: "deterministic-writer" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack.id, item.id]);

  const ink = dark ? "text-white" : "text-zinc-900";
  const muted = dark ? "text-white/70" : "text-zinc-600";
  const active = showArabic && copy?.ar ? copy.ar : copy?.en;

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className={cx("text-lg font-semibold", ink)}>Highlights</h2>
        <button
          onClick={() => setShowArabic((v) => !v)}
          disabled={!copy?.ar}
          title={copy?.ar ? "Toggle Arabic" : "Arabic translation requires an AI key"}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
            dark ? "border-white/20 text-white/80 hover:bg-white/10" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
          )}
        >
          <Languages className="h-3.5 w-3.5" /> {showArabic ? "English" : "العربية"}
        </button>
      </div>

      {!copy ? (
        <div className={cx("flex items-center gap-2 text-sm", muted)}>
          <Loader2 className="h-4 w-4 animate-spin" /> Preparing description…
        </div>
      ) : (
        <div dir={showArabic && copy.ar ? "rtl" : "ltr"}>
          <p className={cx("text-sm leading-relaxed sm:text-base", muted)}>{active?.summary}</p>
          <ul className="mt-4 space-y-2">
            {active?.highlights.map((h, i) => (
              <li key={i} className={cx("flex items-start gap-2 text-sm", ink)}>
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

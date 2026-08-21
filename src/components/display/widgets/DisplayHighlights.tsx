import { Check } from "lucide-react";
import type { DisplayWidgetContext } from "../types";

/** Deterministic, real item copy — no AI call in PR1 (the AI Display Design Assistant lands in a later PR of this initiative and stays opt-in there too). */
export function DisplayHighlights({ item }: DisplayWidgetContext) {
  if (!item.subtitle && item.highlights.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <h2 className="mb-4 text-lg font-semibold text-white">Highlights</h2>
      <p className="text-sm leading-relaxed text-white/70 sm:text-base">{item.subtitle}</p>
      <ul className="mt-4 space-y-2">
        {item.highlights.map((h, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {h}
          </li>
        ))}
      </ul>
    </section>
  );
}

import { Icon } from "@/lib/icon";
import type { DisplayWidgetContext } from "../types";

/**
 * Real neighborhood data off item.lifestyle (the same source the Interactive
 * Lifestyle Map draws from) — schools, transport, healthcare, etc, each with
 * a real walk/drive time, not fabricated. Honest empty state when the item
 * has no lifestyle data at all (e.g. a non-real-estate vertical).
 */
export function DisplayNeighborhood({ item, mode }: DisplayWidgetContext) {
  const lifestyle = item.lifestyle;

  if (!lifestyle) {
    if (mode === "preview") {
      return (
        <section className="mx-auto max-w-3xl px-6 py-10 text-center sm:px-10">
          <p className="text-sm text-white/40">This listing has no neighborhood data configured.</p>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <h2 className="mb-1 text-lg font-semibold text-white">{lifestyle.district}</h2>
      <p className="mb-5 text-sm text-white/60">{lifestyle.summary}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {lifestyle.metrics.map((m, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <Icon name={m.icon} className="h-4 w-4 text-brand" />
            <div className="mt-2 text-sm font-medium text-white">{m.label}</div>
            <div className="text-xs text-white/50">{m.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

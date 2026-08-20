import type { DisplayWidgetContext } from "../types";

/** Readable label for an attribute key — camelCase -> "Area sqm" style. */
function labelize(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function DisplaySpecs({ item }: DisplayWidgetContext) {
  const entries = Object.entries(item.attributes).filter(([, v]) => v !== false);
  if (entries.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <h2 className="mb-4 text-lg font-semibold text-white">Specs</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-4 sm:grid-cols-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs uppercase tracking-wide text-white/50">{labelize(key)}</dt>
            <dd className="text-sm font-medium text-white">{value === true ? "Yes" : String(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

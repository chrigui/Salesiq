import { cx } from "@/components/ui/primitives";
import type { BrochureWidgetContext } from "../types";

/** Readable label for an attribute key — camelCase -> "Area sqm" style. */
function labelize(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function Specs({ item, dark }: BrochureWidgetContext) {
  const entries = Object.entries(item.attributes).filter(([, v]) => v !== false);
  if (entries.length === 0) return null;

  const ink = dark ? "text-white" : "text-zinc-900";
  const muted = dark ? "text-white/60" : "text-zinc-500";
  const border = dark ? "border-white/10" : "border-zinc-200";

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <h2 className={cx("mb-4 text-lg font-semibold", ink)}>Specs</h2>
      <dl className={cx("grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-4 sm:grid-cols-3", border)}>
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className={cx("text-xs uppercase tracking-wide", muted)}>{labelize(key)}</dt>
            <dd className={cx("text-sm font-medium", ink)}>{value === true ? "Yes" : String(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

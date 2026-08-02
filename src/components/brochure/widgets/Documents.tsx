import { FileText } from "lucide-react";
import { cx } from "@/components/ui/primitives";
import type { BrochureWidgetContext } from "../types";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Documents({ slug, assets, dark }: BrochureWidgetContext) {
  if (assets.length === 0) return null;

  const ink = dark ? "text-white" : "text-zinc-900";
  const muted = dark ? "text-white/60" : "text-zinc-500";
  const border = dark ? "border-white/10" : "border-zinc-200";

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <h2 className={cx("mb-4 text-lg font-semibold", ink)}>Documents</h2>
      <div className="space-y-2">
        {assets.map((a) => (
          <a
            key={a.id}
            href={`/api/public/brochures/${slug}/assets/${a.id}`}
            target="_blank"
            rel="noreferrer"
            className={cx(
              "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
              border,
              dark ? "hover:bg-white/5" : "hover:bg-zinc-50",
            )}
          >
            <FileText className={cx("h-4 w-4 shrink-0", muted)} />
            <span className={cx("flex-1 truncate text-sm font-medium", ink)}>{a.name}</span>
            <span className={cx("shrink-0 text-xs", muted)}>{formatSize(a.sizeBytes)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

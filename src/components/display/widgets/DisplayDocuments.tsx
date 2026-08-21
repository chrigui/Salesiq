import { FileText } from "lucide-react";
import type { DisplayWidgetContext } from "../types";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DisplayDocuments({ assets, assetsBaseUrl, mode }: DisplayWidgetContext) {
  if (assets.length === 0) {
    if (mode === "preview") {
      return (
        <section className="mx-auto max-w-3xl px-6 py-10 text-center sm:px-10">
          <p className="text-sm text-white/40">No documents uploaded to this profile yet.</p>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <h2 className="mb-4 text-lg font-semibold text-white">Documents</h2>
      <div className="space-y-2">
        {assets.map((a) => (
          <a
            key={a.id}
            href={`${assetsBaseUrl}/${a.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 transition hover:bg-white/5"
          >
            <FileText className="h-4 w-4 shrink-0 text-white/60" />
            <span className="flex-1 truncate text-sm font-medium text-white">{a.name}</span>
            <span className="shrink-0 text-xs text-white/50">{formatSize(a.sizeBytes)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

import { FileText } from "lucide-react";
import type { DisplayWidgetContext } from "../types";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Compact card variant of DisplayDocuments — same real uploaded assets, capped to fit a grid card. */
export function DisplayDocumentsCard({ assets, assetsBaseUrl, mode }: DisplayWidgetContext) {
  const rows = assets.slice(0, 4);

  if (rows.length === 0) {
    if (mode === "preview") {
      return (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center">
          <p className="text-xs text-white/40">No documents uploaded to this profile yet.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Documents</div>
      <div className="space-y-1.5">
        {rows.map((a) => (
          <a
            key={a.id}
            href={`${assetsBaseUrl}/${a.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs transition hover:bg-white/5"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-white/50" />
            <span className="flex-1 truncate text-white/80">{a.name}</span>
            <span className="shrink-0 text-white/40">{formatSize(a.sizeBytes)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

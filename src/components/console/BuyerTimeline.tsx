"use client";

import {
  Loader2,
  History,
  Eye,
  Bookmark,
  Ban,
  FileText,
  GitCompareArrows,
  MessageSquareText,
  ShieldQuestion,
} from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useBuyerTimeline, type TimelineEntry } from "@/core/store/buyerProfiles";

const ICONS: Record<TimelineEntry["kind"], typeof History> = {
  activity: GitCompareArrows,
  relationship: Eye,
  "requirement-change": History,
  conversation: MessageSquareText,
  objection: ShieldQuestion,
};

// Relationship rows get a sharper icon per state than the generic Eye
// default, since "saved"/"rejected" carry real meaning at a glance.
function iconFor(entry: TimelineEntry) {
  if (entry.kind === "relationship") {
    if (entry.title.startsWith("Saved")) return Bookmark;
    if (entry.title.startsWith("Rejected")) return Ban;
    if (entry.title.startsWith("Proposal")) return FileText;
  }
  return ICONS[entry.kind];
}

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

/**
 * Buyer Timeline (Wave 2) — one merged, chronological feed across every
 * category Buyer Intelligence tracks: behavioral/item-relationship state,
 * requirement changes, conversation captures, and objections. Replaces the
 * Wave 1 Requirement History / Activity / Conversation Memory panels, which
 * told the same story split across three places. Objections and Rejected
 * Options keep their own panels (Resolve/Override actions a flat timeline
 * can't represent), but objections still appear here too for the full
 * chronological picture.
 */
export function BuyerTimeline({ buyerProfileId }: { buyerProfileId: string }) {
  const { entries, isLoading } = useBuyerTimeline(buyerProfileId);

  return (
    <Panel title="Timeline" className="lg:col-span-2">
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Nothing recorded yet — every activity, requirement change, conversation, and objection for this buyer will
          appear here.
        </p>
      ) : (
        <ol className="space-y-1">
          {entries.map((entry, i) => {
            const Icon = iconFor(entry);
            return (
              <li key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {i < entries.length - 1 && <span className="w-px flex-1 bg-zinc-200" />}
                </div>
                <div className={cx("flex-1 pb-4", i === entries.length - 1 && "pb-1")}>
                  <p className="text-sm font-medium text-zinc-900">{entry.title}</p>
                  {entry.detail && <p className="mt-0.5 text-sm text-zinc-500">{entry.detail}</p>}
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {timeAgo(entry.ts)}
                    {entry.meta && ` · ${entry.meta}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

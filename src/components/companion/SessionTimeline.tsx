"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  History,
  Sparkles,
  MessageCircleQuestion,
  Eraser,
  Layers,
  Focus,
  Bookmark,
  BookmarkX,
  FileText,
  UserPlus,
  RotateCcw,
  ShieldQuestion,
  Users,
} from "lucide-react";
import type { IndustryPack } from "@/core/types";
import type { TimelineEvent } from "@/core/store/session";

const ICONS: Record<TimelineEvent["kind"], typeof History> = {
  pack: Layers,
  answer: MessageCircleQuestion,
  "clear-answer": Eraser,
  view: Layers,
  focus: Focus,
  "bookmark-add": Bookmark,
  "bookmark-remove": BookmarkX,
  customer: UserPlus,
  proposal: FileText,
  lead: UserPlus,
  demo: Sparkles,
  reset: RotateCcw,
  objection: ShieldQuestion,
  stakeholder: Users,
};

const VIEW_LABEL: Record<string, string> = {
  welcome: "Welcome screen",
  question: "a question",
  recommendation: "the recommendation",
  compare: "comparison",
  item: "an item detail",
};

/** Human-readable description of a structured timeline event, using the
 * live pack to resolve question/option/item labels. */
function describe(event: TimelineEvent, pack: IndustryPack): string {
  switch (event.kind) {
    case "pack": {
      const p = event.packId;
      return `Switched to ${p ?? "a different"} industry pack`;
    }
    case "answer": {
      const q = pack.questions.find((x) => x.id === event.questionId);
      const label = q?.label ?? event.questionId ?? "a question";
      return `Answered "${label}"${formatValue(event, pack)}`;
    }
    case "clear-answer": {
      const q = pack.questions.find((x) => x.id === event.questionId);
      return `Cleared answer for "${q?.label ?? event.questionId}"`;
    }
    case "view":
      return `Moved to ${VIEW_LABEL[event.view ?? ""] ?? event.view}`;
    case "focus": {
      if (!event.itemId) return "Returned to the recommendation";
      const item = pack.inventory.find((i) => i.id === event.itemId);
      return `Opened ${item?.name ?? "an item"}`;
    }
    case "bookmark-add": {
      const item = pack.inventory.find((i) => i.id === event.itemId);
      return `Bookmarked ${item?.name ?? "an item"}`;
    }
    case "bookmark-remove": {
      const item = pack.inventory.find((i) => i.id === event.itemId);
      return `Removed bookmark from ${item?.name ?? "an item"}`;
    }
    case "proposal":
      return event.detail ?? "Generated a proposal";
    case "lead":
      return event.detail ?? "Saved lead to CRM";
    case "demo":
      return event.detail ?? "Loaded demo scenario";
    case "reset":
      return event.detail ?? "Session reset";
    case "objection":
      return event.detail ?? "Handled an objection";
    case "stakeholder":
      return event.detail ?? "Updated the buying committee";
    default:
      return event.detail ?? "Interaction";
  }
}

function formatValue(event: TimelineEvent, pack: IndustryPack): string {
  const q = pack.questions.find((x) => x.id === event.questionId);
  const v = event.value;
  if (v == null) return "";
  if (q?.type === "single" && typeof v === "string") {
    const opt = q.options?.find((o) => o.id === v);
    return `: ${opt?.label ?? v}`;
  }
  if (q?.type === "multi" && Array.isArray(v)) {
    const labels = v.map((id) => q.options?.find((o) => o.id === id)?.label ?? id);
    return labels.length ? `: ${labels.join(", ")}` : "";
  }
  if (q?.type === "toggle") return v ? ": Yes" : ": No";
  if (
    typeof v === "object" &&
    v !== null &&
    "min" in v &&
    "max" in v
  ) {
    return `: ${v.min.toLocaleString()}–${v.max.toLocaleString()}`;
  }
  if (typeof v === "number") return `: ${v}`;
  if (typeof v === "string") return `: ${v}`;
  return "";
}

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

/**
 * Session Timeline (Module 3). A chronological log of every meaningful
 * interaction in the current session — every answer, view change, item
 * opened, bookmark, proposal and lead — so the salesperson can review what
 * was covered without scrolling back through the conversation.
 */
export function SessionTimeline({
  open,
  onClose,
  events,
  pack,
}: {
  open: boolean;
  onClose: () => void;
  events: TimelineEvent[];
  pack: IndustryPack;
}) {
  const ordered = [...events].reverse();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-strong flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Session timeline</h3>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {ordered.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-faint">
                  Nothing recorded yet — every answer, view and action in this
                  session will appear here.
                </p>
              ) : (
                <ol className="space-y-1">
                  {ordered.map((event, i) => {
                    const Icon = ICONS[event.kind] ?? History;
                    return (
                      <li key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/5 text-ink-muted">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          {i < ordered.length - 1 && (
                            <span className="w-px flex-1 bg-white/10" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm leading-snug text-ink">
                            {describe(event, pack)}
                          </p>
                          <p className="text-[11px] text-ink-faint">
                            {timeAgo(event.ts)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <div className="border-t border-white/5 px-6 py-3 text-center text-[11px] text-ink-faint">
              {events.length} interaction{events.length === 1 ? "" : "s"} recorded
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

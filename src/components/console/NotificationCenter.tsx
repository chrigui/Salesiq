"use client";

import { AlertTriangle, Bell, CheckCheck, UserPlus, Trophy, Settings2 } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useLeads } from "@/core/store/leads";
import {
  markAllRead,
  markRead,
  useNotifications,
  type Notification,
  type NotificationKind,
} from "@/core/data/notifications";

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  lead: UserPlus,
  deal: Trophy,
  system: Settings2,
};

const KIND_STYLE: Record<NotificationKind, string> = {
  lead: "bg-sky-100 text-sky-700",
  deal: "bg-emerald-100 text-emerald-700",
  system: "bg-amber-100 text-amber-700",
};

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Notification Center (Module 4). Two feeds, both real: "Alerts" is derived
 * live from lead records each render (overdue follow-ups) — nothing stored,
 * nothing to go stale. "Notifications" is a stored, event-driven log created
 * at the exact moment something happens elsewhere — a lead saved
 * (ProposalSheet), a deal marked won (LeadManagement), a webhook delivery
 * failing (integrations.ts) — via notify(), not a mockup feed.
 */
export function NotificationCenter({ onOpenLeads }: { onOpenLeads?: () => void }) {
  const leads = useLeads();
  const notifications = useNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  const overdue = leads.filter(
    (l) => l.followUpAt != null && l.followUpAt < Date.now() && l.status !== "won" && l.status !== "lost",
  );

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <Panel title="Alerts">
          <div className="space-y-2">
            {overdue.map((l) => (
              <button
                key={l.id}
                onClick={onOpenLeads}
                className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left transition hover:bg-rose-100"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-rose-900">
                    Follow-up overdue — {l.name}
                  </div>
                  <div className="text-xs text-rose-500">
                    {l.itemName} · was due {formatDate(l.followUpAt as number)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Notifications"
        right={
          unread > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
            </button>
          )
        }
      >
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
            <Bell className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
            Nothing yet. New leads, deals won and system events will appear
            here as they happen.
          </div>
        ) : (
          <div className="space-y-1.5">
            {notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function NotificationRow({ notification: n }: { notification: Notification }) {
  const Icon = KIND_ICON[n.kind];
  return (
    <button
      onClick={() => !n.read && markRead(n.id)}
      className={cx(
        "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition",
        n.read ? "border-zinc-100 bg-white hover:bg-zinc-50" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100",
      )}
    >
      <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full", KIND_STYLE[n.kind])}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cx("text-sm", n.read ? "text-zinc-600" : "font-semibold text-zinc-900")}>
            {n.title}
          </span>
          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
        </div>
        <div className="text-xs text-zinc-400">{n.detail}</div>
      </div>
      <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(n.createdAt)}</span>
    </button>
  );
}

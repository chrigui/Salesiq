"use client";

import { ScrollText, SlidersHorizontal, Ticket, CreditCard, Building2 } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { useAuditLog } from "@/core/data/auditLog";

const ACTION_ICON: { match: RegExp; icon: typeof ScrollText }[] = [
  { match: /feature flag/i, icon: SlidersHorizontal },
  { match: /coupon/i, icon: Ticket },
  { match: /plan/i, icon: Building2 },
  { match: /invoice|payment/i, icon: CreditCard },
];

function iconFor(action: string) {
  return ACTION_ICON.find((a) => a.match.test(action))?.icon ?? ScrollText;
}

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/**
 * Audit Logs (Module 5) — "everything is logged." A real, chronological
 * record of every platform-admin action taken elsewhere in this module:
 * feature flags flipped, tenant plans changed, coupons created or removed.
 */
export function AuditLog() {
  const entries = useAuditLog();

  return (
    <div className="space-y-4">
      <Panel title="Audit log">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
            <ScrollText className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
            No admin actions recorded yet.
          </div>
        ) : (
          <ol className="space-y-1">
            {entries.map((entry, i) => {
              const Icon = iconFor(entry.action);
              return (
                <li key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {i < entries.length - 1 && <span className="w-px flex-1 bg-zinc-100" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm leading-snug text-zinc-900">
                      <span className="font-medium">{entry.action}</span> — {entry.target}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {entry.detail} · {entry.actor} · {timeAgo(entry.ts)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </div>
  );
}

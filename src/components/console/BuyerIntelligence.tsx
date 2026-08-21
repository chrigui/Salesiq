"use client";

import { BrainCircuit, Loader2, Mail, Phone } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { useBuyerProfiles } from "@/core/store/buyerProfiles";

function timeAgo(ms: number | null): string {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * The salesperson-facing entry point into Buyer Intelligence — "the SalesIQ
 * Buyer Brain." PR1 ships the identity layer: every buyer who's given a
 * name plus an email or phone during a Companion session, brochure visit,
 * or kiosk lead capture resolves to one persistent profile here instead of
 * a fresh disconnected Lead each time. Requirements/priorities/intent/
 * objections land in the following PRs — this list is real, not a mockup,
 * but intentionally thin until then.
 */
export function BuyerIntelligence() {
  const { buyerProfiles, isLoading } = useBuyerProfiles();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BrainCircuit className="h-5 w-5 text-zinc-400" />
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Buyer Intelligence</h2>
          <p className="text-xs text-zinc-400">
            A persistent, private profile per buyer — built from real Companion sessions, brochure visits, and
            kiosk captures, never fabricated.
          </p>
        </div>
      </div>

      <Panel title="Buyers">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : buyerProfiles.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            No buyer activity yet. Profiles appear here once a Companion session, brochure visit, or kiosk
            capture provides a name plus an email or phone.
          </p>
        ) : (
          <div className="space-y-2">
            {buyerProfiles.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-500">
                  {b.name.slice(0, 1).toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-900">{b.name || "Unnamed buyer"}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400">
                    {b.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {b.email}
                      </span>
                    )}
                    {b.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {b.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs text-zinc-400">
                  <div>{b.assignedToName ?? "Unassigned"}</div>
                  <div>{timeAgo(b.lastInteractionAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

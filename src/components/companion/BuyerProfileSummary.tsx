"use client";

import { useState } from "react";
import { ClipboardList, Pencil, X } from "lucide-react";
import { useSession } from "@/core/store/session";
import { useLivePack } from "@/core/store/packs";
import { useBuyerProfile } from "@/core/store/buyerProfiles";
import { buildAnswerSummary, buildPriorityEntries } from "./answerSummary";
import { useMeetingFlow } from "./meetingFlow";
import { DISCOVERY_GROUPS } from "./discoveryGroups";

/**
 * A live, always-current view of what's been captured so far during
 * discovery — reusing the exact same session.answers/BuyerProfile data the
 * workspace and recommendation engine already read, never a parallel
 * source of truth. Tapping an entry jumps back to the wizard step that
 * question lives in, per the spec's "tap to edit" requirement.
 */
export function BuyerProfileSummary() {
  const session = useSession();
  const pack = useLivePack(session.packId);
  const flow = useMeetingFlow();
  const { buyerProfile } = useBuyerProfile(session.buyerProfileId);
  const [open, setOpen] = useState(false);

  const sections = buildAnswerSummary(pack, session.answers);
  const priorityEntries = buildPriorityEntries(buyerProfile?.priorities, pack);
  const totalNoted = sections.reduce((n, s) => n + s.entries.length, 0) + priorityEntries.length;

  if (totalNoted === 0) return null;

  const groups = DISCOVERY_GROUPS[pack.id] ?? [];
  const jumpTo = (questionId: string) => {
    const idx = groups.findIndex((g) => g.questionIds.includes(questionId));
    if (idx >= 0) flow.setWizardGroupIndex(idx);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="glass-strong fixed right-4 top-4 z-40 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-white/10 transition hover:bg-white/10"
      >
        <ClipboardList className="h-3.5 w-3.5 text-brand" />
        {totalNoted} noted
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-strong max-h-[75vh] w-full max-w-sm overflow-y-auto rounded-[1.8rem] p-5 ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Buyer profile</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-ink-faint hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id}>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    {section.label}
                  </div>
                  <div className="space-y-1">
                    {section.entries.map((entry) => (
                      <button
                        key={entry.questionId}
                        onClick={() => jumpTo(entry.questionId)}
                        className="flex w-full items-center justify-between rounded-xl bg-white/5 px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10"
                      >
                        <span className="text-ink-faint">{entry.label}</span>
                        <span className="flex items-center gap-1.5 font-medium text-ink">
                          {entry.value}
                          <Pencil className="h-3 w-3 text-ink-faint" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {priorityEntries.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    What matters most
                  </div>
                  <div className="space-y-1">
                    {priorityEntries.map((entry) => (
                      <div
                        key={entry.questionId}
                        className="flex items-center justify-between rounded-xl bg-white/5 px-2.5 py-1.5 text-xs"
                      >
                        <span className="text-ink-faint">{entry.label}</span>
                        <span className="font-medium text-ink">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

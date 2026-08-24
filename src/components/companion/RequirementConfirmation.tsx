"use client";

import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { useSession } from "@/core/store/session";
import { useLivePack } from "@/core/store/packs";
import { useBuyerProfile } from "@/core/store/buyerProfiles";
import { toPriorityWeights } from "@/core/buyerIntelligence/priorityWeights";
import { scoreInventory } from "@/core/engine/scoring";
import { narrativeForMatchCount } from "@/core/engine/explain";
import { deriveCommuteOption, deriveLocationPreferencesOption } from "./discoveryScoring";
import { buildAnswerSummary, buildPriorityEntries } from "./answerSummary";
import { useMeetingFlow } from "./meetingFlow";

/**
 * The compact "Here's what we heard" recap between the end of discovery and
 * the Property Explorer — read-only confirmation of the real answers just
 * given, with an honest match count computed by the same scoreInventory
 * call the wizard and explorer already use. Edit sends the salesperson back
 * into the wizard rather than opening a second editing surface.
 */
export function RequirementConfirmation() {
  const session = useSession();
  const pack = useLivePack(session.packId);
  const flow = useMeetingFlow();
  const { buyerProfile } = useBuyerProfile(session.buyerProfileId);

  const sections = buildAnswerSummary(pack, session.answers);
  const priorityEntries = buildPriorityEntries(buyerProfile?.priorities, pack);

  const priorityWeights = useMemo(
    () => toPriorityWeights(buyerProfile?.priorities ?? null),
    [buyerProfile?.priorities],
  );
  const commuteOption = useMemo(
    () => deriveCommuteOption(session.answers, session.workLocationLat, session.workLocationLng),
    [session.answers, session.workLocationLat, session.workLocationLng],
  );
  const locationPreferencesOption = useMemo(
    () => deriveLocationPreferencesOption(session.answers),
    [session.answers],
  );
  const matchCount = useMemo(() => {
    const scored = scoreInventory(pack, session.answers, {
      priorityWeights,
      commute: commuteOption,
      locationPreferences: locationPreferencesOption,
    });
    return scored.filter((s) => s.score > 0).length;
  }, [pack, session.answers, priorityWeights, commuteOption, locationPreferencesOption]);

  return (
    <div className="bg-aurora flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="glass-strong w-full max-w-sm rounded-[2.2rem] p-8 ring-1 ring-white/10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/15 text-brand">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-ink">Here&apos;s what we heard</h1>
        <p className="mt-1 text-center text-xs text-ink-faint">
          {narrativeForMatchCount(matchCount, pack.inventory.length) || "Ready to look at your matches."}
        </p>

        <div className="mt-6 max-h-[42vh] space-y-4 overflow-y-auto pr-1">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                {section.label}
              </div>
              <div className="space-y-1">
                {section.entries.map((entry) => (
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

        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={() => flow.goTo("discover")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
          >
            Edit
          </button>
          <button
            onClick={() => flow.goTo("explore")}
            className="flex-1 rounded-2xl bg-brand py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Look at your matches
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ArrowLeft, Check, Circle, X } from "lucide-react";
import { useSession } from "@/core/store/session";
import { useBuyerProfile } from "@/core/store/buyerProfiles";
import { rankPriorities, computePriorityPerformance, type PriorityPerformanceStatus } from "@/core/buyerIntelligence/priorityOrder";
import { labelForRequirement } from "./answerSummary";
import type { ScoredItem } from "@/core/engine/scoring";
import type { IndustryPack } from "@/core/types";
import type { BuyerPriority, PriorityImportance } from "@/core/buyerIntelligence/priorityWeights";

/** Stable content key — safer than object identity across a profile refetch. */
function priorityKey(priority: BuyerPriority): string {
  return priority.questionId ?? `req:${priority.requirement}`;
}

const IMPORTANCE_LABEL: Record<PriorityImportance, string> = {
  must: "Must have",
  important: "Important",
  preferred: "Preferred",
  nice: "Nice to have",
  not_important: "Not important",
};

const STATUS_ICON: Record<PriorityPerformanceStatus, React.ReactNode> = {
  met: <Check className="h-3.5 w-3.5 text-emerald-400" />,
  partial: <Circle className="h-3 w-3 text-brand" />,
  unmet: <X className="h-3.5 w-3.5 text-ink-faint" />,
};

/**
 * Decision Room's "priorities" step — "YOU SAID THESE MATTER MOST" (spec
 * section 9). Reads the same real BuyerProfile.priorities every other
 * Buyer Intelligence surface reads, ranked by rankPriorities (the real
 * IMPORTANCE_MULTIPLIER ordering, never a second scheme), with a per-
 * property performance grid from computePriorityPerformance — the same
 * breakdown/ruleSpecs cross-reference DecisionBreakdown uses.
 */
export function PrioritiesPanel({
  pack,
  group,
  onBack,
}: {
  pack: IndustryPack;
  group: ScoredItem[];
  onBack: () => void;
}) {
  const session = useSession();
  const { buyerProfile } = useBuyerProfile(session.buyerProfileId);
  const ranked = rankPriorities(buyerProfile?.priorities);
  const performanceByItem = new Map(
    group.map((s) => [
      s.item.id,
      new Map(computePriorityPerformance(buyerProfile?.priorities, s, pack).map((p) => [priorityKey(p.priority), p.status])),
    ]),
  );

  return (
    <div className="bg-aurora min-h-screen px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to comparison
        </button>

        <h1 className="text-xl font-semibold text-ink">You said these matter most</h1>
        <p className="mt-0.5 text-xs text-ink-faint">
          Ranked by how much weight each priority carries in the recommendation.
        </p>

        {ranked.length === 0 ? (
          <p className="mt-6 text-sm text-ink-faint">No priorities captured for this buyer yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-separate border-spacing-y-1.5 text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-faint">
                  <th className="pb-1 font-medium">Priority</th>
                  {group.map((s) => (
                    <th key={s.item.id} className="pb-1 pl-3 text-center font-medium">
                      {s.item.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((priority, i) => {
                  const key = priority.questionId ?? `${priority.requirement}-${i}`;
                  return (
                    <tr key={key} className="rounded-xl bg-white/5">
                      <td className="rounded-l-xl px-3 py-2.5">
                        <div className="font-medium text-ink">{labelForRequirement(priority.requirement, pack)}</div>
                        <div className="text-[11px] text-ink-faint">{IMPORTANCE_LABEL[priority.importance]}</div>
                      </td>
                      {group.map((s, gi) => {
                        const status = performanceByItem.get(s.item.id)?.get(priorityKey(priority));
                        return (
                          <td
                            key={s.item.id}
                            className={`px-3 py-2.5 text-center ${gi === group.length - 1 ? "rounded-r-xl" : ""}`}
                          >
                            {status ? (
                              <span className="inline-flex items-center justify-center">{STATUS_ICON[status]}</span>
                            ) : (
                              <span className="text-[11px] text-ink-faint">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

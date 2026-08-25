"use client";

import { useState } from "react";
import { ArrowLeft, Trophy, Wallet, LandPlot, TrendingUp, ClipboardPlus, Sparkles } from "lucide-react";
import { useSession } from "@/core/store/session";
import { formatMoney } from "@/core/engine/explain";
import type { ScoredItem } from "@/core/engine/scoring";

/**
 * Decision Room's "recommend" step — spec section 19's "YOUR BEST MATCH" +
 * section 21's "THE NEXT STEP". [RECOMMEND] and every Next Step action route
 * through the same real presentItem() atomic action Display Control uses
 * (never a second Display-targeting mechanism), so the Display never
 * flashes through an intermediate view. [CREATE LUMMA RECAP] stays visibly
 * disabled — Recap is explicitly the next stage, not built here, and
 * nothing should pretend otherwise.
 */
export function DecisionRoomRecommend({
  group,
  onBack,
}: {
  group: ScoredItem[];
  onBack: () => void;
}) {
  const session = useSession();
  const [presented, setPresented] = useState(false);
  const [addedToRecap, setAddedToRecap] = useState(false);
  const winner = group.length > 0 ? group.reduce((best, s) => (s.score > best.score ? s : best), group[0]) : null;

  if (!winner) {
    return (
      <div className="bg-aurora flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-ink-faint">Nothing in the comparison to recommend yet.</p>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-ink-muted transition hover:bg-white/10"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to comparison
        </button>
      </div>
    );
  }

  const recommend = () => {
    session.presentItem(winner.item.id, "recommendation");
    setPresented(true);
  };

  return (
    <div className="bg-aurora min-h-screen px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-lg">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to comparison
        </button>

        <div className="glass-strong rounded-[1.8rem] p-5 ring-1 ring-white/10">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
            <Trophy className="h-3.5 w-3.5" />
            Your best match
          </div>
          <h1 className="text-xl font-semibold text-ink">{winner.item.name}</h1>
          <p className="text-xs text-ink-faint">{winner.item.location?.label}</p>
          <p className="mt-1 text-base font-semibold text-brand">
            {formatMoney(winner.item.price, winner.item.currency)}
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Based on what you told us, {winner.item.name} is the strongest overall fit — {winner.score}% match.
          </p>
          <ul className="mt-3 space-y-1">
            {winner.reasons.slice(0, 4).map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                {r}
              </li>
            ))}
          </ul>

          <button
            onClick={recommend}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Trophy className="h-4 w-4" />
            {presented ? "Shown to customer" : "Recommend"}
          </button>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">The next step</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => session.presentItem(winner.item.id, "payment")}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-[11px] font-medium text-ink-muted transition hover:bg-white/10"
            >
              <Wallet className="h-4 w-4 text-brand" />
              Explore payment
            </button>
            <button
              onClick={() => session.presentItem(winner.item.id, "floorPlan")}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-[11px] font-medium text-ink-muted transition hover:bg-white/10"
            >
              <LandPlot className="h-4 w-4 text-brand" />
              View floor plan
            </button>
            <button
              onClick={() => session.presentItem(winner.item.id, "investment")}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-[11px] font-medium text-ink-muted transition hover:bg-white/10"
            >
              <TrendingUp className="h-4 w-4 text-brand" />
              View investment
            </button>
          </div>

          <button
            onClick={() => {
              session.addToRecap(winner.item.id);
              setAddedToRecap(true);
            }}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
          >
            <ClipboardPlus className="h-3.5 w-3.5 text-brand" />
            {addedToRecap ? "Added to recap" : "Add to recap"}
          </button>

          <button
            disabled
            title="Coming soon"
            className="mt-2 flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-ink-faint opacity-50"
          >
            Create LUMMA recap
            <span className="text-[10px] font-normal uppercase tracking-wide">Coming soon</span>
          </button>
        </div>
      </div>
    </div>
  );
}

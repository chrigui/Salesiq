"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, QrCode, Sparkles, Wifi, UserRound } from "lucide-react";
import { useSync } from "@/components/providers/SyncProvider";
import { useSession } from "@/core/store/session";
import { useLivePack } from "@/core/store/packs";
import { useBuyerProfile } from "@/core/store/buyerProfiles";
import { scoreInventory, type ScoredItem } from "@/core/engine/scoring";
import { narrate, formatMoney } from "@/core/engine/explain";
import { ItemImage } from "@/components/ui/ItemImage";
import { cx } from "@/components/ui/primitives";
import { useDecisionRoomWidgetContext } from "./useDecisionRoomWidgetContext";
import { toCustomerSafeItem, toCustomerSafeCustomerName } from "@/lib/customerSafe";
import { DisplayPriceSummary } from "./widgets/DisplayPriceSummary";
import { DisplayInvestment } from "./widgets/DisplayInvestment";
import { DisplayDocuments } from "./widgets/DisplayDocuments";
import type { IndustryPack } from "@/core/types";

/**
 * QR Continue Experience (Module 2). The customer scans a code on the big
 * screen and picks up the same recommendation on their own phone — a
 * read-only mirror of the live session, not a second controller. It rides
 * the exact same viewer transport the display itself uses (see
 * SyncProvider), so it only ever shows real, currently-live session data —
 * never a fabricated one. "Save" is local to this phone (component state),
 * deliberately not written back to the shared session.
 */
export function ContinueExperience() {
  const { room, status } = useSync();
  const { packId, answers, customer, recapItemIds, buyerProfileId } = useSession();
  const pack = useLivePack(packId);
  const { buyerProfile } = useBuyerProfile(buyerProfileId);
  const [saved, setSaved] = useState<string[]>([]);
  const [waitedLong, setWaitedLong] = useState(false);

  const hasAnswers = Object.keys(answers).length > 0;
  // Same customerSafe seam DisplayStage.tsx applies — this public,
  // unauthenticated page must never trust an item field to stay safe by
  // convention alone.
  const scored = scoreInventory(pack, answers).map((s) => ({ ...s, item: toCustomerSafeItem(s.item) }));

  // Once a salesperson has curated a real recap, this becomes the actual
  // "LUMMA Recap" continuation (spec sections 27-28) — the shortlist they
  // built, not a fresh auto-scored guess. Falls back to today's live
  // top-3 snapshot when nothing has been added to recap yet.
  const recapScored = recapItemIds
    .map((id) => scored.find((s) => s.item.id === id))
    .filter((s): s is ScoredItem => Boolean(s));
  const recapMode = recapScored.length > 0;
  const top = recapMode ? recapScored.reduce((best, s) => (s.score > best.score ? s : best), recapScored[0]) : scored[0];
  const rest = recapMode ? recapScored.filter((s) => s.item.id !== top.item.id) : scored.slice(1, 3);

  useEffect(() => {
    if (hasAnswers) return;
    const t = window.setTimeout(() => setWaitedLong(true), 8000);
    return () => window.clearTimeout(t);
  }, [hasAnswers]);

  if (!room) {
    return (
      <EmptyState
        icon={QrCode}
        title="Nothing to continue here"
        body="Scan the QR code shown on the display to pick up your session on this phone."
      />
    );
  }

  if (!hasAnswers) {
    return (
      <EmptyState
        icon={Wifi}
        title={waitedLong ? "Still connecting…" : "Connecting to the display"}
        body={
          waitedLong
            ? "This is taking a while — make sure this phone has an internet connection, then try scanning the code again."
            : "Hang tight — pulling in what you've been shown."
        }
        pulse
      />
    );
  }

  const firstName = toCustomerSafeCustomerName(customer).trim().split(" ")[0];

  return (
    <div className="bg-aurora min-h-screen px-5 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/20 text-lg text-brand ring-1 ring-brand/30">
            {pack.branding.logoGlyph}
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">{pack.branding.name}</div>
            <div className="text-[11px] text-ink-faint">Continuing on your phone</div>
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-1 text-2xl font-semibold tracking-tight"
        >
          {recapMode
            ? `${firstName ? `${firstName}, your` : "Your"} LUMMA recap`
            : `${firstName ? `Hi ${firstName}, here's` : "Here's"} what we found for you`}
        </motion.h1>
        <p className="mb-6 text-sm text-ink-muted">
          {recapMode
            ? "Everything we explored together, in one place."
            : "Pulled live from your session — browse at your own pace."}
        </p>

        {top && (
          <div className="glass-strong overflow-hidden rounded-3xl">
            <ItemImage image={top.item.image} photo={top.item.photo} className="h-44 w-full">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <button
                onClick={() =>
                  setSaved((s) =>
                    s.includes(top.item.id) ? s.filter((id) => id !== top.item.id) : [...s, top.item.id],
                  )
                }
                aria-label="Save to this phone"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 backdrop-blur-md transition hover:bg-black/60"
              >
                <Heart
                  className={cx(
                    "h-4.5 w-4.5 transition",
                    saved.includes(top.item.id) ? "fill-rose-400 text-rose-400" : "text-white",
                  )}
                />
              </button>
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">{top.item.name}</div>
                  <div className="text-xs text-white/70">{top.item.subtitle}</div>
                </div>
                <div className="rounded-full bg-brand/90 px-2.5 py-1 text-xs font-semibold text-white">
                  {top.score} match
                </div>
              </div>
            </ItemImage>

            <div className="p-5">
              <div className="mb-3 text-lg font-semibold text-brand">
                {formatMoney(top.item.price, top.item.currency)}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-ink-muted">{narrate(top, pack)}</p>
              <div className="space-y-1.5">
                {top.item.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-xs text-ink-muted">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand" /> {h}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Also considered
            </div>
            <div className="space-y-2">
              {rest.map((s) => (
                <div
                  key={s.item.id}
                  className="glass flex items-center justify-between rounded-2xl px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium">{s.item.name}</div>
                    <div className="text-xs text-ink-faint">
                      {formatMoney(s.item.price, s.item.currency)}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-ink-faint">{s.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recapMode && top && <RecapPropertyDetails pack={pack} item={top.item} scored={scored} />}

        {recapMode && buyerProfile?.assignedToName && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
            <UserRound className="h-4 w-4 shrink-0 text-brand" />
            <span className="text-ink-muted">Your LUMMA advisor: {buyerProfile.assignedToName}</span>
          </div>
        )}

        {recapMode && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-ink-muted">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Next steps
            </div>
            Ready to move forward? Reach out to your advisor to arrange a viewing or start the paperwork.
          </div>
        )}

        {saved.length > 0 && (
          <p className="mt-4 text-center text-[11px] text-ink-faint">
            {saved.length} saved on this phone
          </p>
        )}

        <p className="mt-8 text-center text-[11px] text-ink-faint">
          {status === "paired" ? "Live · " : ""}Room {room}
        </p>
      </div>
    </div>
  );
}

/**
 * Real payment/investment summary + uploaded documents for the recap's top
 * item — reuses the exact same public-route-safe widget context Decision
 * Room's Investment/Payment stages already use, never a second data path.
 * A separate component (not inlined above) so useDecisionRoomWidgetContext
 * — a hook — is only ever called unconditionally at its own top level,
 * while the parent mounts it conditionally per Rules of Hooks.
 */
function RecapPropertyDetails({
  pack,
  item,
  scored,
}: {
  pack: IndustryPack;
  item: ScoredItem["item"];
  scored: ScoredItem[];
}) {
  const context = useDecisionRoomWidgetContext(pack, item, scored);
  return (
    <div className="mt-4 space-y-3">
      <DisplayPriceSummary {...context} />
      <DisplayInvestment {...context} />
      <DisplayDocuments {...context} />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  pulse,
}: {
  icon: typeof QrCode;
  title: string;
  body: string;
  pulse?: boolean;
}) {
  return (
    <div className="bg-aurora grid min-h-screen place-items-center px-6 text-center">
      <div>
        <div
          className={cx(
            "mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/25",
            pulse && "animate-pulse",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="mb-1.5 text-lg font-semibold">{title}</h1>
        <p className="mx-auto max-w-xs text-sm text-ink-muted">{body}</p>
      </div>
    </div>
  );
}

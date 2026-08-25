"use client";

import { motion } from "framer-motion";
import { ClipboardList, Trophy } from "lucide-react";
import { useSync } from "@/components/providers/SyncProvider";
import { useContinueQrDataUrl } from "./ContinueQr";
import { formatMoney } from "@/core/engine/explain";
import { ItemImage } from "@/components/ui/ItemImage";
import type { ScoredItem } from "@/core/engine/scoring";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/**
 * Spec section 27: "YOUR LUMMA RECAP" + a large QR the customer scans to
 * carry the same experience to their phone. Reads the real, salesperson-
 * curated session.recapItemIds (never a re-derived top score) — the
 * highest-scored recap item is framed as "Your best match," the rest as
 * "Also considered." Reuses ContinueQr's own QR generation against the
 * live sync room rather than a second QR mechanism.
 */
export function RecapStage({ recapItems }: { recapItems: ScoredItem[] }) {
  const { room, continueUrl } = useSync();
  const qr = useContinueQrDataUrl(continueUrl);

  if (recapItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={spring}
        className="flex w-full max-w-md flex-col items-center text-center"
      >
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand">
          <ClipboardList className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">LUMMA Recap</h2>
        <p className="mt-2 text-sm text-ink-faint">Nothing added to the recap yet.</p>
      </motion.div>
    );
  }

  const best = recapItems.reduce((top, s) => (s.score > top.score ? s : top), recapItems[0]);
  const rest = recapItems.filter((s) => s.item.id !== best.item.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="grid w-full max-w-5xl grid-cols-1 gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center"
    >
      <div>
        <h2 className="text-4xl font-semibold tracking-tight">Your LUMMA recap</h2>
        <p className="mt-2 text-ink-faint">Everything we explored together, in one place.</p>

        <div className="mt-6 glass overflow-hidden rounded-3xl">
          <ItemImage image={best.item.image} photo={best.item.photo} className="h-44">
            <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">
              <Trophy className="h-3.5 w-3.5" />
              Your best match
            </div>
          </ItemImage>
          <div className="p-5">
            <h3 className="text-xl font-semibold">{best.item.name}</h3>
            <p className="text-sm text-ink-faint">{best.item.location?.label ?? best.item.subtitle}</p>
            <p className="mt-2 text-lg font-semibold text-brand">
              {formatMoney(best.item.price, best.item.currency)}
            </p>
          </div>
        </div>

        {rest.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Also considered
            </div>
            <div className="space-y-2">
              {rest.map((s) => (
                <div key={s.item.id} className="glass flex items-center justify-between rounded-2xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{s.item.name}</div>
                    <div className="text-xs text-ink-faint">{formatMoney(s.item.price, s.item.currency)}</div>
                  </div>
                  <div className="text-xs font-semibold text-ink-faint">{s.score}% match</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-strong flex flex-col items-center rounded-3xl p-8 text-center">
        <p className="text-sm text-ink-muted">Take your experience with you.</p>
        <div className="mt-5 w-fit rounded-2xl bg-white p-3">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Continue on your phone QR code" width={200} height={200} />
          ) : (
            <div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-zinc-200" />
          )}
        </div>
        {room && (
          <div className="mt-4 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Room {room}</div>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { MonitorPlay, Loader2, Check } from "lucide-react";

/**
 * A second, independent identity from the MQTT room-code pairing this page
 * already does (see <PairingOverlay/>): that one lets a Companion push a
 * live session to this screen; this one gives the physical screen itself a
 * persistent identity in the Displays registry, so Display Studio can
 * assign it an idle profile and the dashboard can show it as online.
 * Deliberately a small corner card, not a full-screen overlay — it must
 * never block the existing pairing/attract flow while unclaimed.
 *
 * Device state is owned by a single useDisplayDevice() call in DisplayRoot
 * and passed down here — this component must never call the hook itself,
 * or two independent instances race to auto-claim the same pairing code.
 */
export function DevicePairingPrompt({
  claimed,
  claiming,
  claimError,
  claim,
}: {
  claimed: boolean;
  claiming: boolean;
  claimError: string | null;
  claim: (pairingCode: string) => Promise<boolean>;
}) {
  const [code, setCode] = useState("");
  const [justClaimed, setJustClaimed] = useState(false);

  if (claimed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[70] w-72 rounded-2xl border border-white/10 bg-black/70 p-4 text-white backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/50">
        <MonitorPlay className="h-3.5 w-3.5" /> Display Studio
      </div>
      {justClaimed ? (
        <p className="flex items-center gap-1.5 text-sm text-emerald-300">
          <Check className="h-4 w-4" /> Registered — idle experience will apply shortly.
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs text-white/60">
            Not yet registered as a managed display. Enter the pairing code from Display Studio to enable idle-experience control.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await claim(code.trim());
              if (ok) setJustClaimed(true);
            }}
            className="flex gap-1.5"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Pairing code"
              maxLength={6}
              className="w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm uppercase tracking-widest text-white placeholder:text-white/30 placeholder:tracking-normal outline-none focus:border-white/30"
            />
            <button
              type="submit"
              disabled={claiming || code.trim().length === 0}
              className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:brightness-95 disabled:opacity-40"
            >
              {claiming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Pair"}
            </button>
          </form>
          {claimError && <p className="mt-1.5 text-[11px] text-red-300">{claimError}</p>}
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import { Smartphone, X, Check, Wifi, WifiOff } from "lucide-react";
import { useSync } from "@/components/providers/SyncProvider";
import { cx } from "@/components/ui/primitives";

/* ----------------------------- Display side ----------------------------- */

/**
 * Full-screen pairing prompt for the Customer Display. Shows a room code + QR;
 * scanning it opens the Companion already paired. Auto-dismisses once a phone
 * connects, and leaves a small status chip so the state is always visible.
 */
export function PairingOverlay() {
  const { role, room, status, companionUrl } = useSync();
  const [open, setOpen] = useState(true);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (status === "paired") setOpen(false);
  }, [status]);

  useEffect(() => {
    if (!companionUrl) return;
    QRCode.toDataURL(companionUrl, {
      margin: 1,
      width: 240,
      color: { dark: "#0a0f1c", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [companionUrl]);

  if (role !== "display" || !room) return null;

  const paired = status === "paired";

  return (
    <>
      {/* Persistent status chip (also the re-open affordance) */}
      <button
        onClick={() => setOpen(true)}
        className={cx(
          "fixed left-1/2 top-3 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur-xl transition",
          paired
            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
            : "border-white/15 bg-black/40 text-white/80 hover:bg-black/60",
        )}
      >
        {paired ? (
          <>
            <Smartphone className="h-3.5 w-3.5" /> Phone connected
          </>
        ) : (
          <>
            <Wifi className="h-3.5 w-3.5" /> Pair phone · {room}
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="glass-strong relative w-full max-w-sm rounded-3xl p-8 text-center"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/20 text-brand ring-1 ring-brand/30">
                <Smartphone className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Connect your phone
              </h2>
              <p className="mt-1.5 text-sm text-ink-muted">
                Scan with the salesperson&rsquo;s phone to control this display.
              </p>

              <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="Pairing QR code" width={220} height={220} />
                ) : (
                  <div className="h-[220px] w-[220px] animate-pulse rounded-lg bg-zinc-200" />
                )}
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-[0.2em] text-ink-faint">
                  or enter code
                </div>
                <div className="mt-1 text-4xl font-semibold tracking-[0.3em] text-gradient">
                  {room}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-muted">
                <StatusDot status={status} />
                {status === "paired"
                  ? "Phone connected"
                  : status === "connecting"
                    ? "Waiting for your phone…"
                    : status === "connected"
                      ? "Ready — waiting for your phone…"
                      : status === "error"
                        ? "Connection issue — retrying…"
                        : "Starting…"}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------------------- Companion side ---------------------------- */

/** Compact pairing status / join control for the Sales Companion. */
export function CompanionSyncBar() {
  const { role, room, status, setRoom } = useSync();
  const [code, setCode] = useState("");
  if (role !== "companion") return null;

  const paired = status === "paired";

  // No room yet — offer to join by code.
  if (!room) {
    return (
      <div className="flex items-center gap-2 border-b border-white/5 px-5 py-2.5">
        <WifiOff className="h-4 w-4 shrink-0 text-ink-faint" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Display code"
          maxLength={6}
          className="w-28 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm tracking-widest outline-none placeholder:text-ink-faint focus:border-brand/50"
        />
        <button
          onClick={() => setRoom(code)}
          disabled={!code}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40"
        >
          Connect
        </button>
      </div>
    );
  }

  return (
    <div
      className={cx(
        "flex items-center gap-2 border-b border-white/5 px-5 py-2 text-xs font-medium",
        paired ? "text-emerald-300" : "text-ink-muted",
      )}
    >
      <StatusDot status={status} />
      {paired ? (
        <>
          <Check className="h-3.5 w-3.5" /> Connected to display · {room}
        </>
      ) : (
        <>Connecting to {room}…</>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "paired"
      ? "bg-emerald-400"
      : status === "error"
        ? "bg-rose-400"
        : "bg-amber-400";
  return (
    <span className="relative flex h-2 w-2">
      {status !== "paired" && (
        <span
          className={cx(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            color,
          )}
        />
      )}
      <span className={cx("relative inline-flex h-2 w-2 rounded-full", color)} />
    </span>
  );
}

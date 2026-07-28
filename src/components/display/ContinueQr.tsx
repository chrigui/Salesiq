"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import { Smartphone, X } from "lucide-react";
import { useSync } from "@/components/providers/SyncProvider";

/**
 * QR Continue Experience (Module 2) — the display-side trigger. A customer
 * scans this to pick up the current recommendation, read-only, on their own
 * phone. Reuses the display's existing sync room (see SyncProvider) rather
 * than minting a separate one, so it works the moment the page loads.
 */
export function ContinueQrModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { room, continueUrl } = useSync();
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!continueUrl) return;
    QRCode.toDataURL(continueUrl, {
      margin: 1,
      width: 220,
      color: { dark: "#0a0f1c", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [continueUrl]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="glass-strong relative w-full max-w-sm rounded-3xl p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/20 text-brand ring-1 ring-brand/30">
              <Smartphone className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Continue on your phone
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              Scan to pick up your recommendation and browse at your own pace.
            </p>

            <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="Continue on your phone QR code" width={200} height={200} />
              ) : (
                <div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-zinc-200" />
              )}
            </div>

            {room && (
              <div className="mt-4 text-[11px] uppercase tracking-[0.2em] text-ink-faint">
                Room {room}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

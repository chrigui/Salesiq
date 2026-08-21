import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Smartphone } from "lucide-react";
import { useSync } from "@/components/providers/SyncProvider";
import type { DisplayWidgetContext } from "../types";

/** Inline "continue on your phone" QR, embedded in the composition itself rather than the tap-to-open modal DisplayStage already offers. Reuses the same sync room, so it works the moment the page loads. Renders nothing outside a real paired Display (no room minted in editor preview). */
export function DisplayContinueQr({ mode }: DisplayWidgetContext) {
  const { continueUrl } = useSync();
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!continueUrl) {
      setQr(null);
      return;
    }
    QRCode.toDataURL(continueUrl, { margin: 1, width: 180, color: { dark: "#0a0f1c", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [continueUrl]);

  if (!continueUrl) {
    if (mode === "preview") {
      return (
        <section className="mx-auto max-w-3xl px-6 py-6 sm:px-10">
          <div className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-xs text-white/40">
            QR code appears here on the real Customer Display.
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-6 sm:px-10">
      <div className="flex items-center gap-4 rounded-2xl border border-white/10 p-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/20 text-brand ring-1 ring-brand/30">
          <Smartphone className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">Continue on your phone</div>
          <p className="text-xs text-white/60">Scan to pick up this listing and browse at your own pace.</p>
        </div>
        <div className="shrink-0 rounded-xl bg-white p-2">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Continue on your phone QR code" width={100} height={100} />
          ) : (
            <div className="h-[100px] w-[100px] animate-pulse rounded-lg bg-zinc-200" />
          )}
        </div>
      </div>
    </section>
  );
}

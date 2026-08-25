"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import type { DisplayWidgetContext } from "../types";

/** Compact card variant of DisplayLeadCapture — same real submission path, stacked inputs to fit a grid card. */
export function DisplayLeadCaptureCard({ item, pack, mode, deviceId, deviceToken }: DisplayWidgetContext) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  if (!deviceId || !deviceToken) {
    if (mode === "preview") {
      return (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs text-white/40">
          Lead capture form appears here on the real Customer Display.
        </div>
      );
    }
    return null;
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white">
        <Check className="h-4 w-4 shrink-0 text-success" /> Thanks — someone will follow up shortly.
      </div>
    );
  }

  const submit = async () => {
    if (!name.trim()) return;
    setStatus("submitting");
    const res = await fetch(`/api/public/displays/${deviceId}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: deviceToken, packId: pack.id, itemId: item.id, name, phone, email }),
    });
    setStatus(res.ok ? "done" : "error");
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Interested?</div>
      <div className="space-y-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40"
        />
      </div>
      <Button
        onClick={submit}
        variant="brand"
        disabled={!name.trim() || status === "submitting"}
        className="mt-2 w-full text-xs"
      >
        {status === "submitting" && <Loader2 className="h-3 w-3 animate-spin" />}
        Request a callback
      </Button>
      {status === "error" && <p className="mt-1.5 text-[10px] text-danger">Something went wrong — try again.</p>}
    </div>
  );
}

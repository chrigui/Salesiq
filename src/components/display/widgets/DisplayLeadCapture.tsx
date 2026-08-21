import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { DisplayWidgetContext } from "../types";

/** Real lead-capture form, embedded in the composition. Only functional on a real claimed Display (deviceId/deviceToken present) — the editor preview shows an honest disabled state instead of a form that goes nowhere. */
export function DisplayLeadCapture({ item, pack, mode, deviceId, deviceToken }: DisplayWidgetContext) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  if (!deviceId || !deviceToken) {
    if (mode === "preview") {
      return (
        <section className="mx-auto max-w-3xl px-6 py-6 sm:px-10">
          <div className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-xs text-white/40">
            Lead capture form appears here on the real Customer Display.
          </div>
        </section>
      );
    }
    return null;
  }

  if (status === "done") {
    return (
      <section className="mx-auto max-w-3xl px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 p-5 text-sm text-white">
          <Check className="h-4 w-4 text-brand" /> Thanks — someone from our team will follow up shortly.
        </div>
      </section>
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
    <section className="mx-auto max-w-3xl px-6 py-6 sm:px-10">
      <div className="rounded-2xl border border-white/10 p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Interested in {item.name}?</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        </div>
        <button
          onClick={submit}
          disabled={!name.trim() || status === "submitting"}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-black transition disabled:opacity-40"
        >
          {status === "submitting" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Request a callback
        </button>
        {status === "error" && <p className="mt-2 text-xs text-red-400">Something went wrong — please try again.</p>}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Check, Loader2, Mail, MessageCircle } from "lucide-react";
import { cx } from "@/components/ui/primitives";
import type { BrochureWidgetContext } from "../types";

export function LeadForm({ slug, item, dark, onTrackClick }: BrochureWidgetContext) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ink = dark ? "text-white" : "text-zinc-900";
  const muted = dark ? "text-white/60" : "text-zinc-500";
  const border = dark ? "border-white/15" : "border-zinc-200";
  const inputClass = cx(
    "w-full rounded-xl border px-3 py-2.5 text-sm outline-none",
    border,
    dark ? "bg-white/5 text-white placeholder:text-white/30" : "bg-white text-zinc-900 placeholder:text-zinc-400",
  );

  const submit = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/brochures/${slug}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, notes }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      onTrackClick("lead-form");
    } catch {
      setError("Couldn't send your request — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={cx("border-t px-6 py-12 sm:px-10", border)}>
      <div className="mx-auto max-w-xl">
        <h2 className={cx("text-lg font-semibold", ink)}>Interested in {item.name}?</h2>
        <p className={cx("mt-1 text-sm", muted)}>
          Leave your details and an agent will reach out — or book a viewing.
        </p>

        {done ? (
          <div className={cx("mt-5 flex items-center gap-2 rounded-xl border p-4 text-sm", border, ink)}>
            <Check className="h-4 w-4 text-brand" /> Thanks — we&apos;ll be in touch shortly.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <input className={inputClass} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputClass} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className={inputClass} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <textarea
              className={cx(inputClass, "resize-none")}
              rows={3}
              placeholder="Anything specific you'd like to know?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button
              onClick={submit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Book a viewing
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hi, I'm interested in ${item.name}`)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => onTrackClick("whatsapp")}
                className={cx(
                  "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition",
                  border,
                  dark ? "text-white/80 hover:bg-white/10" : "text-zinc-600 hover:bg-zinc-50",
                )}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(item.name)}`}
                onClick={() => onTrackClick("email")}
                className={cx(
                  "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition",
                  border,
                  dark ? "text-white/80 hover:bg-white/10" : "text-zinc-600 hover:bg-zinc-50",
                )}
              >
                <Mail className="h-4 w-4" /> Email
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

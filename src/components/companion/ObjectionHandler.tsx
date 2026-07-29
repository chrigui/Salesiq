"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldQuestion, Sparkles, Loader2 } from "lucide-react";
import { useSession } from "@/core/store/session";
import { COMMON_OBJECTIONS } from "@/core/engine/objection";
import { getKnowledgeBase, knowledgePayload } from "@/core/data/knowledgeBase";
import { getAiSettings } from "@/core/data/aiSettings";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

/**
 * Objection Handler (Module 6 · AI Engine).
 *
 * A salesperson picks or types a customer objection mid-conversation and
 * gets a response grounded in the current recommendation's verified facts
 * plus the tenant's Knowledge Base — never a generic sales script.
 * Deterministic by default (works offline, instant); Claude-authored when
 * ANTHROPIC_API_KEY is set, with a graceful fallback on any error. The UI
 * shown here is identical either way.
 */
export function ObjectionHandler({
  open,
  onClose,
  pack,
  scored,
}: {
  open: boolean;
  onClose: () => void;
  pack: IndustryPack;
  scored: ScoredItem[];
}) {
  const { answers, logEvent } = useSession();
  const best = scored[0];
  const [objection, setObjection] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setObjection("");
      setResponse(null);
      setEngine(null);
    }
  }, [open]);

  const run = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setObjection(q);
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/ai/objection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          answers,
          objection: q,
          knowledge: knowledgePayload(getKnowledgeBase()),
          settings: getAiSettings(),
        }),
      });
      const data = await res.json();
      if (data?.response) {
        setResponse(data.response);
        setEngine(data.engine ?? null);
        logEvent({ kind: "objection", detail: `Handled objection: "${q}"` });
      }
    } catch {
      setResponse("Couldn't reach the response engine — check the connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-strong flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldQuestion className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Objection handler</h3>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {best ? (
                <p className="mb-3 text-xs text-ink-faint">
                  Responses are grounded in why we recommended{" "}
                  <span className="text-ink-muted">{best.item.name}</span> —
                  never invented.
                </p>
              ) : (
                <p className="mb-3 text-xs text-ink-faint">
                  Answer a few questions first for a response tied to a
                  specific recommendation.
                </p>
              )}

              <div className="mb-3 flex flex-wrap gap-1.5">
                {COMMON_OBJECTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => run(o)}
                    disabled={loading}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-muted transition hover:border-brand/40 hover:text-ink disabled:opacity-50"
                  >
                    {o}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-brand/50">
                <input
                  value={objection}
                  onChange={(e) => setObjection(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") run(objection);
                  }}
                  placeholder="Type what the customer said…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
                />
                <button
                  onClick={() => run(objection)}
                  disabled={loading || !objection.trim()}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:brightness-110 disabled:opacity-40"
                  aria-label="Get response"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </button>
              </div>

              {response && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm leading-relaxed text-ink">{response}</p>
                  {engine && (
                    <p className="mt-2 text-[10px] text-ink-faint">
                      {engine === "claude+objection"
                        ? "Authored by Claude from verified facts."
                        : "Deterministic responder — set ANTHROPIC_API_KEY for Claude-authored prose."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

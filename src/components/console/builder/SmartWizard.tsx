"use client";

import { useState } from "react";
import { X, Wand2, Loader2, Sparkles, Check } from "lucide-react";
import { Field, TextArea } from "./fields";
import { saveInventory, saveQuestions, saveRuleSpecs, saveSections } from "@/core/store/packs";
import { getAiSettings } from "@/core/data/aiSettings";
import type { IndustryPack } from "@/core/types";

const EXAMPLES = [
  "Luxury watch boutique — price range $5k–$50k, customers care about heritage, water resistance and complications.",
  "Solar panel installer — residential systems $8k–$40k, customers care about payback period, roof size and battery storage.",
  "Wedding venue — packages $10k–$60k, customers care about guest capacity, indoor/outdoor space and catering style.",
];

/**
 * Smart Wizard (Module 4). "10 minutes until the client meeting" — describe
 * the business in a sentence and get a working pack: questions, sample
 * inventory and scoring rules, generated together so they're consistent
 * with each other, saved straight into this pack's draft via the same
 * save*() calls the manual builders use. Claude-authored when
 * ANTHROPIC_API_KEY is set, a generic starter template otherwise — either
 * way it's a real, scoreable dashboard the moment it lands, not a mockup.
 */
export function SmartWizard({
  packId,
  pack,
  onClose,
  onGenerated,
}: {
  packId: string;
  pack: IndustryPack;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    engine: string;
    questions: number;
    inventory: number;
    rules: number;
  } | null>(null);

  const hasExistingContent =
    pack.questions.length > 0 || pack.inventory.length > 0;

  const generate = async () => {
    const desc = description.trim();
    if (!desc || loading) return;
    if (
      hasExistingContent &&
      !confirm(
        `This replaces ${pack.label}'s current questions, inventory and scoring rules. Continue?`,
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          label: pack.label,
          vertical: pack.vertical,
          currency: pack.currency,
          settings: getAiSettings(),
        }),
      });
      const data = await res.json();
      if (!data?.pack) {
        setError("Couldn't generate a dashboard — try a shorter description.");
        return;
      }
      const { sections, questions, inventory, ruleSpecs } = data.pack;
      saveSections(packId, sections);
      saveQuestions(packId, questions);
      saveInventory(packId, inventory);
      saveRuleSpecs(packId, ruleSpecs);
      setResult({
        engine: data.engine,
        questions: questions.length,
        inventory: inventory.length,
        rules: ruleSpecs.length,
      });
    } catch {
      setError("Generation failed — check the connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-zinc-900" />
            <h3 className="text-base font-semibold text-zinc-900">Smart Wizard</h3>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Check className="h-4 w-4" /> {pack.label} is ready to demo
              </div>
              <p className="mt-1 text-xs text-emerald-700">
                {result.questions} question{result.questions === 1 ? "" : "s"} ·{" "}
                {result.inventory} item{result.inventory === 1 ? "" : "s"} ·{" "}
                {result.rules} scoring rule{result.rules === 1 ? "" : "s"}
              </p>
            </div>
            <p className="text-[11px] text-zinc-400">
              {result.engine === "claude+wizard"
                ? "Authored by Claude from your description."
                : "Generic starter template — set ANTHROPIC_API_KEY for Claude-authored, business-specific content."}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setResult(null);
                  setDescription("");
                }}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
              >
                Generate again
              </button>
              <button
                onClick={onGenerated}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Take me to Questions
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">
              Describe {pack.label} in a sentence or two — price range, and
              what customers care about most. Generates a full set of
              questions, sample inventory and scoring rules for{" "}
              {pack.label}, ready to demo.
            </p>
            <Field label="Business description">
              <TextArea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={EXAMPLES[0]}
              />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setDescription(ex)}
                  className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-500 transition hover:bg-zinc-50"
                >
                  {ex.split(" — ")[0]}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50">
                Cancel
              </button>
              <button
                disabled={!description.trim() || loading}
                onClick={generate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {loading ? "Generating…" : "Generate my dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

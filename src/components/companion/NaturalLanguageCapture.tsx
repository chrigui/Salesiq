"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { useSession } from "@/core/store/session";
import { useLivePack } from "@/core/store/packs";
import { extractBuyerText, submitConversationNote, type BuyerExtractionFields } from "@/core/store/buyerProfiles";
import { mapExtractionToAnswers } from "./extractionMapping";

const FIELD_LABELS: { key: keyof BuyerExtractionFields; label: string }[] = [
  { key: "familySize", label: "Family size" },
  { key: "propertyType", label: "Property type" },
  { key: "bedrooms", label: "Bedrooms" },
  { key: "budget", label: "Budget" },
  { key: "preferredLocation", label: "Location" },
  { key: "priorityLabel", label: "Priority" },
  { key: "secondaryLabel", label: "Secondary" },
];

/**
 * "Describe the customer" before discovery even starts — reuses the exact
 * same extractBuyerText/confirm pattern as the workspace's "Understood
 * customer" panel, but on confirm ALSO maps whatever has a clean, honest
 * match onto real session.answers (not just the BuyerProfile), so the
 * salesperson lands in the wizard with those steps already answered to
 * confirm rather than re-asking from scratch. A field with no real question
 * to land on is still saved to the profile, just not pre-filled here.
 */
export function NaturalLanguageCapture({ onApplied }: { onApplied?: () => void }) {
  const session = useSession();
  const pack = useLivePack(session.packId);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<BuyerExtractionFields | null>(null);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  const run = async () => {
    const q = text.trim();
    if (!q || loading) return;
    setLoading(true);
    setAppliedCount(null);
    const result = await extractBuyerText(q);
    setLoading(false);
    setProposal(result && Object.keys(result.extracted).length > 0 ? result.extracted : null);
  };

  const confirm = async () => {
    if (!proposal) return;
    const mapped = mapExtractionToAnswers(pack, proposal);
    for (const [questionId, value] of Object.entries(mapped)) {
      if (value !== undefined) session.answer(questionId, value);
    }
    if (session.buyerProfileId) {
      await submitConversationNote(session.buyerProfileId, {
        rawText: text,
        extracted: proposal,
        status: "confirmed",
        confirmedFields: proposal,
      });
    }
    setAppliedCount(Object.keys(mapped).length);
    setProposal(null);
    setText("");
    onApplied?.();
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 text-left">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Describe the customer</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='"Family of four, looking for a 3-bedroom apartment, budget around 300k-600k, wants schools nearby."'
        rows={2}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none placeholder:text-ink-faint focus:border-brand/50"
      />
      <button
        onClick={() => void run()}
        disabled={!text.trim() || loading}
        className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-white/15 disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
        {loading ? "Reading…" : "Understand"}
      </button>

      {proposal && (
        <div className="mt-3 rounded-xl border border-white/10 p-3">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-ink-faint">Understood</div>
          <div className="space-y-1.5">
            {FIELD_LABELS.filter(({ key }) => proposal[key] !== undefined).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-ink-faint">{label}</span>
                <span className="text-ink">{String(proposal[key])}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => void confirm()}
            className="mt-3 w-full rounded-lg bg-brand px-2 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Confirm & pre-fill
          </button>
        </div>
      )}

      {appliedCount !== null && (
        <p className="mt-2 text-[11px] text-ink-faint">
          {appliedCount > 0
            ? `Pre-filled ${appliedCount} step${appliedCount === 1 ? "" : "s"} — you'll confirm each as you go.`
            : "Saved — nothing here matched a step to pre-fill yet."}
        </p>
      )}
    </div>
  );
}

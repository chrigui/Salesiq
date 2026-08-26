"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Plus,
  Trash2,
  Ban,
  Undo2,
  Gauge,
  Compass,
  ShieldQuestion,
  CheckCircle2,
  Lightbulb,
  Users,
} from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { PACKS } from "@/core/industries";
import {
  useBuyerProfile,
  useBuyerRejectedItems,
  useBuyerObjections,
  useSimilarBuyers,
  useNextBestAction,
  overrideRejectedItem,
  resolveBuyerObjection,
  updateBuyerProfile,
  type BuyerProfile,
} from "@/core/store/buyerProfiles";
import type { BuyerField } from "@/core/buyerIntelligence/types";
import type { BuyerPriority, PriorityImportance } from "@/core/buyerIntelligence/priorityWeights";
import { BuyerTimeline } from "@/components/console/BuyerTimeline";
import { RecapActivityFeed } from "@/components/console/RecapActivityFeed";
import { RecapStatusUpdatedBanner } from "@/components/console/RecapStatusUpdatedBanner";

const PROVENANCE_STYLE: Record<BuyerField<unknown>["provenance"], string> = {
  explicit: "bg-emerald-100 text-emerald-700",
  inferred: "bg-amber-100 text-amber-700",
  observed: "bg-sky-100 text-sky-700",
};

function ProvenanceBadge({ provenance }: { provenance: BuyerField<unknown>["provenance"] }) {
  return (
    <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", PROVENANCE_STYLE[provenance])}>
      {provenance}
    </span>
  );
}

const REQUIREMENT_KEYS = [
  "Property type",
  "Bedrooms",
  "Bathrooms",
  "Size",
  "Budget",
  "Preferred location",
  "Preferred project",
  "Floor preference",
  "View preference",
  "Outdoor space",
  "Parking",
  "Amenities",
  "Completion timeline",
  "Furnishing preference",
  "Other",
];
const FINANCIAL_KEYS = [
  "Budget range",
  "Financing / cash",
  "Down payment range",
  "Payment-plan preference",
  "Financing requirements",
  "Investment budget",
];
const PURPOSE_OPTIONS = ["End user", "Investment", "Second home", "Holiday home", "Rental", "Business use", "Other"];
const MOTIVATION_OPTIONS = [
  "Lifestyle",
  "Family",
  "Investment",
  "Capital appreciation",
  "Rental yield",
  "Location",
  "Privacy",
  "Status",
  "Convenience",
  "Security",
  "School proximity",
  "Beach access",
  "Amenities",
  "Payment flexibility",
];
const IMPORTANCE_OPTIONS: { id: PriorityImportance; label: string }[] = [
  { id: "must", label: "Must have" },
  { id: "important", label: "Important" },
  { id: "preferred", label: "Preferred" },
  { id: "nice", label: "Nice to have" },
  { id: "not_important", label: "Not important" },
];

function inputClass() {
  return "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400";
}

export function BuyerIntelligenceProfile({
  id,
  onBack,
  onOpenBuyer,
}: {
  id: string;
  onBack: () => void;
  onOpenBuyer?: (id: string) => void;
}) {
  const { buyerProfile, isLoading } = useBuyerProfile(id);

  if (isLoading || !buyerProfile) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading buyer profile…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <div className="text-base font-semibold text-zinc-900">{buyerProfile.name || "Unnamed buyer"}</div>
          <div className="flex flex-wrap items-center gap-x-3 text-xs text-zinc-400">
            {buyerProfile.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" /> {buyerProfile.email}
              </span>
            )}
            {buyerProfile.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" /> {buyerProfile.phone}
              </span>
            )}
            <span>{buyerProfile.assignedToName ?? "Unassigned"}</span>
          </div>
        </div>
      </div>

      <RecapStatusUpdatedBanner buyerProfileId={id} />
      <IntentReadinessPanel buyerProfile={buyerProfile} />
      <NextBestActionPanel buyerProfile={buyerProfile} />

      <div className="grid gap-4 lg:grid-cols-2">
        <KeyValuePanel
          title="Requirements"
          category="requirements"
          fields={buyerProfile.requirements}
          presetKeys={REQUIREMENT_KEYS}
          buyerProfileId={id}
        />
        <KeyValuePanel
          title="Financial"
          category="financial"
          fields={buyerProfile.financial}
          presetKeys={FINANCIAL_KEYS}
          buyerProfileId={id}
        />
        <PurposePanel buyerProfile={buyerProfile} />
        <MotivationsPanel buyerProfile={buyerProfile} />
        <PrioritiesPanel buyerProfile={buyerProfile} />
        <RejectedItemsPanel buyerProfileId={id} />
        <ObjectionsPanel buyerProfileId={id} />
        <SimilarBuyersPanel buyerProfileId={id} onOpenBuyer={onOpenBuyer} />
        <RecapActivityFeed buyerProfileId={id} />
        <BuyerTimeline buyerProfileId={id} />
      </div>
    </div>
  );
}

function KeyValuePanel({
  title,
  category,
  fields,
  presetKeys,
  buyerProfileId,
}: {
  title: string;
  category: "requirements" | "financial";
  fields: Record<string, BuyerField<unknown>> | null;
  presetKeys: string[];
  buyerProfileId: string;
}) {
  const [key, setKey] = useState(presetKeys[0]);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const entries = Object.entries(fields ?? {});

  const save = async () => {
    if (!value.trim() || saving) return;
    setSaving(true);
    const next = {
      ...(fields ?? {}),
      [key]: { value: value.trim(), provenance: "explicit" as const, updatedAt: Date.now() },
    };
    await updateBuyerProfile(buyerProfileId, { [category]: next });
    setValue("");
    setSaving(false);
  };

  const remove = async (k: string) => {
    const next = { ...(fields ?? {}) };
    delete next[k];
    await updateBuyerProfile(buyerProfileId, { [category]: next });
  };

  return (
    <Panel title={title}>
      <div className="space-y-2">
        {entries.length === 0 && <p className="text-sm text-zinc-400">No {title.toLowerCase()} captured yet.</p>}
        {entries.map(([k, field]) => (
          <div key={k} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">{k}</div>
              <div className="truncate text-sm text-zinc-900">{String(field.value)}</div>
            </div>
            <ProvenanceBadge provenance={field.provenance} />
            <button onClick={() => remove(k)} aria-label={`Remove ${k}`} className="text-zinc-300 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <select value={key} onChange={(e) => setKey(e.target.value)} className={inputClass()}>
          {presetKeys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          className={cx(inputClass(), "flex-1")}
        />
        <button
          onClick={() => void save()}
          disabled={!value.trim() || saving}
          className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </Panel>
  );
}

const INTENT_STYLE: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-500",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-sky-100 text-sky-700",
  very_high: "bg-emerald-100 text-emerald-700",
};

const INTENT_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very high",
};

/** Buyer intent + purchase readiness (spec §5-6) — evidence-backed, computed from this buyer's persisted cross-session record, never a bare score. Replaces what used to live only in the ephemeral, per-session Sales Twin/Copilot. */
function IntentReadinessPanel({ buyerProfile }: { buyerProfile: BuyerProfile }) {
  const hasIntent = Boolean(buyerProfile.intentLevel);
  return (
    <Panel title="Buyer intelligence">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            <Compass className="h-3.5 w-3.5" /> Intent
          </div>
          {hasIntent ? (
            <span
              className={cx(
                "inline-block rounded-full px-2.5 py-1 text-sm font-semibold",
                INTENT_STYLE[buyerProfile.intentLevel ?? "low"],
              )}
            >
              {INTENT_LABEL[buyerProfile.intentLevel ?? "low"]}
            </span>
          ) : (
            <p className="text-sm text-zinc-400">No activity recorded yet.</p>
          )}
          {buyerProfile.intentReasons && buyerProfile.intentReasons.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-zinc-500">
              {buyerProfile.intentReasons.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            <Gauge className="h-3.5 w-3.5" /> Purchase readiness
          </div>
          {buyerProfile.purchaseReadiness ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">{buyerProfile.purchaseReadiness}</span>
                <span className="text-xs text-zinc-400">{buyerProfile.purchaseReadinessConfidence ?? 0}% confidence</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-900"
                  style={{ width: `${buyerProfile.purchaseReadinessConfidence ?? 0}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-400">Exploring — nothing recorded yet.</p>
          )}
          {buyerProfile.purchaseReadinessSignals && buyerProfile.purchaseReadinessSignals.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-zinc-500">
              {buyerProfile.purchaseReadinessSignals.map((s) => (
                <li key={s}>· {s}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}

/** Next Best Action (spec, Wave 1 scope) — a lightweight, real, rule-based hint read off this buyer's own objections/activity/readiness record, never a fabricated "reach out!" filler. The full configurable NBA rule engine is Wave 2. */
/** Wave 2 — tenant-configured rules first, the Wave 1 hardcoded hint as fallback (see resolveNextBestAction / the NBA Rules tab). */
function NextBestActionPanel({ buyerProfile }: { buyerProfile: BuyerProfile }) {
  const { result, isLoading } = useNextBestAction(buyerProfile.id);

  return (
    <Panel title="Next best action">
      <div className="flex items-start gap-2 text-sm">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-zinc-700">
          {isLoading ? "…" : (result?.suggestion ?? "Nothing urgent right now — keep the conversation going.")}
        </p>
      </div>
    </Panel>
  );
}

function PurposePanel({ buyerProfile }: { buyerProfile: BuyerProfile }) {
  const toggle = (purpose: string) => {
    const has = buyerProfile.purposes.includes(purpose);
    const next = has ? buyerProfile.purposes.filter((p) => p !== purpose) : [...buyerProfile.purposes, purpose];
    void updateBuyerProfile(buyerProfile.id, { purposes: next });
  };

  return (
    <Panel title="Purpose">
      <p className="mb-2 text-[11px] text-zinc-400">Multiple purposes allowed — never forced to one.</p>
      <div className="flex flex-wrap gap-2">
        {PURPOSE_OPTIONS.map((p) => {
          const active = buyerProfile.purposes.includes(p);
          return (
            <button
              key={p}
              onClick={() => toggle(p)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
              )}
            >
              {p}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function MotivationsPanel({ buyerProfile }: { buyerProfile: BuyerProfile }) {
  const motivations = buyerProfile.motivations ?? [];

  const toggle = (label: string) => {
    const existing = motivations.find((m) => m.label === label);
    const next = existing
      ? motivations.filter((m) => m.label !== label)
      : [...motivations, { id: label, label, tier: "secondary" as const, evidence: ["Set by salesperson"] }];
    void updateBuyerProfile(buyerProfile.id, { motivations: next });
  };

  const setTier = (label: string, tier: "primary" | "secondary") => {
    const next = motivations.map((m) => (m.label === label ? { ...m, tier } : m));
    void updateBuyerProfile(buyerProfile.id, { motivations: next });
  };

  return (
    <Panel title="Motivations">
      <div className="flex flex-wrap gap-2">
        {MOTIVATION_OPTIONS.map((m) => {
          const active = motivations.find((x) => x.label === m);
          return (
            <button
              key={m}
              onClick={() => toggle(m)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
              )}
            >
              {m}
            </button>
          );
        })}
      </div>
      {motivations.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {motivations.map((m) => (
            <div key={m.label} className="flex items-center justify-between text-sm">
              <span className="text-zinc-700">{m.label}</span>
              <select
                value={m.tier}
                onChange={(e) => setTier(m.label, e.target.value as "primary" | "secondary")}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function PrioritiesPanel({ buyerProfile }: { buyerProfile: BuyerProfile }) {
  const priorities = buyerProfile.priorities ?? [];
  const [packId, setPackId] = useState(PACKS[0]?.id ?? "");
  const [questionId, setQuestionId] = useState("");
  const [importance, setImportance] = useState<PriorityImportance>("important");
  const pack = PACKS.find((p) => p.id === packId);

  const add = () => {
    const question = pack?.questions.find((q) => q.id === questionId);
    if (!question) return;
    const next: BuyerPriority[] = [
      ...priorities.filter((p) => p.questionId !== questionId),
      { requirement: question.label, questionId, importance },
    ];
    void updateBuyerProfile(buyerProfile.id, { priorities: next });
  };

  const remove = (requirement: string) => {
    void updateBuyerProfile(buyerProfile.id, { priorities: priorities.filter((p) => p.requirement !== requirement) });
  };

  return (
    <Panel title="Priorities">
      <p className="mb-2 text-[11px] text-zinc-400">
        Feeds the real recommendation engine directly — a &ldquo;must have&rdquo; priority linked to a pack question
        measurably re-ranks that buyer&rsquo;s live session.
      </p>
      <div className="space-y-1.5">
        {priorities.length === 0 && <p className="text-sm text-zinc-400">No priorities set yet.</p>}
        {priorities.map((p) => (
          <div key={p.requirement} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2">
            <span className="flex-1 truncate text-sm text-zinc-900">{p.requirement}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium capitalize text-zinc-600">
              {p.importance.replace("_", " ")}
            </span>
            <button onClick={() => remove(p.requirement)} aria-label={`Remove ${p.requirement}`} className="text-zinc-300 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <select
          value={packId}
          onChange={(e) => {
            setPackId(e.target.value);
            setQuestionId("");
          }}
          className={inputClass()}
        >
          {PACKS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select value={questionId} onChange={(e) => setQuestionId(e.target.value)} className={inputClass()}>
          <option value="">Select a question…</option>
          {pack?.questions.map((q) => (
            <option key={q.id} value={q.id}>
              {q.label}
            </option>
          ))}
        </select>
        <select
          value={importance}
          onChange={(e) => setImportance(e.target.value as PriorityImportance)}
          className={inputClass()}
        >
          {IMPORTANCE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={add}
          disabled={!questionId}
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </Panel>
  );
}

function itemLabel(packId: string | null, itemId: string | null): string {
  if (!packId || !itemId) return "";
  const item = PACKS.find((p) => p.id === packId)?.inventory.find((i) => i.id === itemId);
  return item?.name ?? itemId;
}

/** Rejected options (spec §7) — an item this buyer has actively ruled out never resurfaces as a recommendation for them (see excludeItemIds in scoreInventory) unless a salesperson explicitly overrides it here. */
function RejectedItemsPanel({ buyerProfileId }: { buyerProfileId: string }) {
  const { rejectedItems, isLoading } = useBuyerRejectedItems(buyerProfileId);
  return (
    <Panel title="Rejected options">
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rejectedItems.length === 0 ? (
        <p className="text-sm text-zinc-400">Nothing rejected yet.</p>
      ) : (
        <div className="space-y-2">
          {rejectedItems.map((r) => (
            <div key={r.id} className="flex items-start gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm">
              <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-zinc-900">{itemLabel(r.packId, r.itemId)}</div>
                <div className="text-zinc-600">{r.reason}</div>
                <div className="text-[11px] text-zinc-400">
                  {new Date(r.createdAt).toLocaleString()}
                  {r.overriddenAt && ` · overridden ${new Date(r.overriddenAt).toLocaleString()}`}
                </div>
              </div>
              {!r.overriddenAt && (
                <button
                  onClick={() => void overrideRejectedItem(buyerProfileId, r.id)}
                  title="Let this item resurface in recommendations again"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-50"
                >
                  <Undo2 className="h-3 w-3" /> Override
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

const OBJECTION_CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-zinc-100 text-zinc-500",
};

/** Objection tracking (spec §8) — every objection raised through the live Objection Handler, persisted with the exact quote as evidence. A repeated objection of the same kind is recorded at higher confidence, a real signal rather than a guess. */
function ObjectionsPanel({ buyerProfileId }: { buyerProfileId: string }) {
  const { objections, isLoading } = useBuyerObjections(buyerProfileId);
  return (
    <Panel title="Objections">
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : objections.length === 0 ? (
        <p className="text-sm text-zinc-400">No objections logged yet.</p>
      ) : (
        <div className="space-y-2">
          {objections.map((o) => (
            <div key={o.id} className="flex items-start gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm">
              <ShieldQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium capitalize text-zinc-900">{o.kind.replace(/-/g, " ")}</span>
                  <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", OBJECTION_CONFIDENCE_STYLE[o.confidence])}>
                    {o.confidence}
                  </span>
                  {o.resolvedAt && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Resolved
                    </span>
                  )}
                </div>
                {o.evidence[0] && <p className="mt-0.5 italic text-zinc-500">&ldquo;{o.evidence[0]}&rdquo;</p>}
                <div className="text-[11px] text-zinc-400">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
              {!o.resolvedAt && (
                <button
                  onClick={() => void resolveBuyerObjection(buyerProfileId, o.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-50"
                >
                  <CheckCircle2 className="h-3 w-3" /> Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/** Buyer similarity (Wave 2) — real, explainable matches (see findSimilarBuyers); a match with no shared reasons is never shown, and the score itself is never displayed bare. */
function SimilarBuyersPanel({
  buyerProfileId,
  onOpenBuyer,
}: {
  buyerProfileId: string;
  onOpenBuyer?: (id: string) => void;
}) {
  const { matches, isLoading } = useSimilarBuyers(buyerProfileId);
  return (
    <Panel title="Similar buyers">
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : matches.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No similar buyers found yet — this buyer doesn&apos;t share enough with anyone else you can see.
        </p>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => {
            const content = (
              <>
                <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{m.name || "Unnamed buyer"}</p>
                  <ul className="mt-0.5 space-y-0.5 text-xs text-zinc-500">
                    {m.sharedReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </>
            );
            return onOpenBuyer ? (
              <button
                key={m.id}
                onClick={() => onOpenBuyer(m.id)}
                className="flex w-full items-start gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                {content}
              </button>
            ) : (
              <div key={m.id} className="flex items-start gap-2 rounded-xl border border-zinc-200 px-3 py-2">
                {content}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}


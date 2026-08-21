"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Plus,
  Trash2,
  History,
  MessageSquareText,
  Activity,
  Ban,
  Undo2,
} from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { PACKS } from "@/core/industries";
import {
  useBuyerProfile,
  useBuyerRequirementChanges,
  useBuyerConversationNotes,
  useBuyerActivity,
  useBuyerRejectedItems,
  overrideRejectedItem,
  updateBuyerProfile,
  type BuyerProfile,
} from "@/core/store/buyerProfiles";
import type { BuyerField } from "@/core/buyerIntelligence/types";
import type { BuyerPriority, PriorityImportance } from "@/core/buyerIntelligence/priorityWeights";

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

export function BuyerIntelligenceProfile({ id, onBack }: { id: string; onBack: () => void }) {
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
        <HistoryPanel buyerProfileId={id} />
        <ActivityPanel buyerProfileId={id} />
        <RejectedItemsPanel buyerProfileId={id} />
        <ConversationMemoryPanel buyerProfileId={id} />
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

function HistoryPanel({ buyerProfileId }: { buyerProfileId: string }) {
  const { changes, isLoading } = useBuyerRequirementChanges(buyerProfileId);
  return (
    <Panel title="Requirement history">
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : changes.length === 0 ? (
        <p className="text-sm text-zinc-400">No changes recorded yet — nothing has been overwritten.</p>
      ) : (
        <div className="space-y-2">
          {changes.map((c) => (
            <div key={c.id} className="flex items-start gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm">
              <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <div>
                <span className="font-medium text-zinc-900">{c.field}</span> changed from{" "}
                <span className="text-zinc-500">{String(c.previousValue)}</span> to{" "}
                <span className="text-zinc-900">{String(c.newValue)}</span>
                <div className="text-[11px] text-zinc-400">
                  {new Date(c.createdAt).toLocaleString()} · {c.source}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function itemLabel(packId: string | null, itemId: string | null): string {
  if (!packId || !itemId) return "";
  const item = PACKS.find((p) => p.id === packId)?.inventory.find((i) => i.id === itemId);
  return item?.name ?? itemId;
}

const ACTIVITY_KIND_LABEL: Record<string, string> = {
  property_viewed: "Viewed",
  item_saved: "Saved",
  comparison_made: "Compared shortlist",
  proposal_generated: "Proposal generated",
};

/** Behavioral intelligence (spec §3) — a real, timestamped log of what this buyer's linked session actually did, not a summary. Tracking begins at identification: nothing here predates the session being linked to this profile. */
function ActivityPanel({ buyerProfileId }: { buyerProfileId: string }) {
  const { events, isLoading } = useBuyerActivity(buyerProfileId);
  return (
    <Panel title="Buyer activity">
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No activity yet — behavioral tracking starts once a live session is linked to this buyer.
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="flex items-start gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm">
              <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <div>
                <span className="font-medium text-zinc-900">{ACTIVITY_KIND_LABEL[e.kind] ?? e.kind}</span>
                {e.itemId && <span className="text-zinc-600"> · {itemLabel(e.packId, e.itemId)}</span>}
                <div className="text-[11px] text-zinc-400">{new Date(e.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
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

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  edited: "bg-sky-100 text-sky-700",
  rejected: "bg-zinc-100 text-zinc-500",
};

/** Conversation memory (spec §11) — every "describe the customer" capture, confirmed/edited/rejected, in one chronological list. No separate per-session grouping construct: date order already tells the story of how requirements evolved. */
function ConversationMemoryPanel({ buyerProfileId }: { buyerProfileId: string }) {
  const { notes, isLoading } = useBuyerConversationNotes(buyerProfileId);
  return (
    <Panel title="Conversation memory" className="lg:col-span-2">
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Nothing captured yet. Describe this customer in their own words from the Companion — SalesIQ extracts
          structured fields for you to confirm, edit, or reject.
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="flex items-start gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm">
              <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <div className="min-w-0 flex-1">
                <p className="italic text-zinc-500">&ldquo;{n.rawText}&rdquo;</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", STATUS_STYLE[n.status])}>
                    {n.status}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {new Date(n.createdAt).toLocaleString()} · {n.createdByName ?? "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { PURCHASE_READINESS_STAGES } from "@/core/buyerIntelligence/purchaseReadiness";
import { SEGMENT_FIELD_INFO, type BuyerSegmentCriterion, type BuyerSegmentField } from "@/core/buyerIntelligence/segments";

const FIELDS = Object.keys(SEGMENT_FIELD_INFO) as BuyerSegmentField[];

const INTENT_LEVEL_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very high" },
];

const PURPOSE_OPTIONS = ["End user", "Investment", "Second home", "Holiday home", "Rental", "Business use", "Other"];

function inputClass() {
  return "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400";
}

function blankCriterion(): BuyerSegmentCriterion {
  return { field: "intentLevel", value: "high" };
}

/**
 * Copies RulesBuilder.tsx's add/remove/reorder row convention, adapted to
 * the light Buyer Intelligence theme and to criteria's simpler two-field
 * shape (no per-row expand needed — a field picker plus one value control
 * is the whole row). assignedToId/branchId take a raw id (free text) since
 * there's no wired team-member/branch picker endpoint yet — everything else
 * is a real dropdown over the actual values Buyer Intelligence stores.
 */
export function SegmentBuilder({
  criteria,
  onChange,
}: {
  criteria: BuyerSegmentCriterion[];
  onChange: (next: BuyerSegmentCriterion[]) => void;
}) {
  const update = (i: number, patch: Partial<BuyerSegmentCriterion>) =>
    onChange(criteria.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i: number) => onChange(criteria.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= criteria.length) return;
    const next = [...criteria];
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  };
  const add = () => onChange([...criteria, blankCriterion()]);

  return (
    <div className="space-y-2">
      {criteria.map((c, i) => (
        <div key={i} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2">
          <select
            value={c.field}
            onChange={(e) => {
              const field = e.target.value as BuyerSegmentField;
              update(i, { field, value: field === "intentLevel" ? "high" : "" });
            }}
            className={inputClass()}
          >
            {FIELDS.map((f) => (
              <option key={f} value={f}>
                {SEGMENT_FIELD_INFO[f].label}
              </option>
            ))}
          </select>

          <CriterionValueInput criterion={c} onChange={(value) => update(i, { value })} />

          <div className="ml-auto flex items-center gap-0.5">
            <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label="Move down" disabled={i === criteria.length - 1} onClick={() => move(i, 1)}>
              <ArrowDown className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label="Remove criterion" onClick={() => remove(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </IconBtn>
          </div>
        </div>
      ))}
      {criteria.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-sm text-zinc-400">
          No criteria yet — a segment with no criteria would match every buyer.
        </p>
      )}
      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
      >
        <Plus className="h-4 w-4" /> Add criterion
      </button>
    </div>
  );
}

function CriterionValueInput({
  criterion,
  onChange,
}: {
  criterion: BuyerSegmentCriterion;
  onChange: (value: string) => void;
}) {
  if (criterion.field === "intentLevel") {
    return (
      <select value={criterion.value} onChange={(e) => onChange(e.target.value)} className={inputClass()}>
        {INTENT_LEVEL_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (criterion.field === "purchaseReadiness") {
    return (
      <select value={criterion.value} onChange={(e) => onChange(e.target.value)} className={inputClass()}>
        {PURCHASE_READINESS_STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    );
  }
  if (criterion.field === "purpose") {
    return (
      <select value={criterion.value} onChange={(e) => onChange(e.target.value)} className={inputClass()}>
        {PURPOSE_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type="text"
      value={criterion.value}
      placeholder={criterion.field === "priorityRequirement" ? "e.g. Schools" : "Paste an id"}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass()}
    />
  );
}

function IconBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Scale,
} from "lucide-react";
import { cx } from "@/components/ui/primitives";
import { getEffectivePack, saveRuleSpecs } from "@/core/store/packs";
import { RULE_KIND_INFO } from "@/core/industries/rules";
import type { RuleKind, RuleSpec } from "@/core/types";
import { Field, NumberInput, Select, TextInput } from "./fields";

const KINDS = Object.keys(RULE_KIND_INFO) as RuleKind[];

// Which reason placeholders each kind understands.
const REASON_HINT: Partial<Record<RuleKind, string>> = {
  atLeast: "Template — use {have} and {need}, e.g. “it offers {have} beds for your {need}”",
  proximity: "Template — use {value}, e.g. “schools within {value} minutes”",
  feature: "Shown when the item has the feature",
};

function blankRule(questionId: string): RuleSpec {
  return {
    id: `rule-${Math.random().toString(36).slice(2, 7)}`,
    kind: "feature",
    questionId,
    attribute: "",
    weight: 2,
    reason: "it has the feature you asked for",
  };
}

export function RulesBuilder({ packId }: { packId: string }) {
  const [specs, setSpecs] = useState<RuleSpec[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const pack = getEffectivePack(packId);
  const questions = pack.questions;

  // Every attribute key present on any inventory item — offered as suggestions.
  const attributeKeys = useMemo(() => {
    const set = new Set<string>();
    for (const it of pack.inventory)
      for (const k of Object.keys(it.attributes)) set.add(k);
    return [...set].sort();
  }, [pack.inventory]);

  useEffect(() => {
    setSpecs(getEffectivePack(packId).ruleSpecs ?? []);
    setOpenId(null);
  }, [packId]);

  const commit = (next: RuleSpec[]) => {
    setSpecs(next);
    saveRuleSpecs(packId, next);
  };
  const update = (id: string, patch: Partial<RuleSpec>) =>
    commit(specs.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => commit(specs.filter((s) => s.id !== id));
  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= specs.length) return;
    const next = [...specs];
    [next[index], next[to]] = [next[to], next[index]];
    commit(next);
  };
  const add = () => {
    const r = blankRule(questions[0]?.id ?? "");
    commit([...specs, r]);
    setOpenId(r.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-faint">
          {specs.length} rule{specs.length === 1 ? "" : "s"} · every answer is
          weighed against each item; reasons appear in the recommendation
        </p>
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add rule
        </button>
      </div>

      <div className="space-y-2">
        {specs.map((s, i) => (
          <RuleRow
            key={s.id}
            spec={s}
            index={i}
            total={specs.length}
            questions={questions}
            attributeKeys={attributeKeys}
            open={openId === s.id}
            onToggle={() => setOpenId(openId === s.id ? null : s.id)}
            onChange={(patch) => update(s.id, patch)}
            onRemove={() => remove(s.id)}
            onMove={(dir) => move(i, dir)}
          />
        ))}
        {specs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-ink-faint">
            No rules yet. Add one to start scoring inventory against answers.
          </div>
        )}
      </div>
    </div>
  );
}

function RuleRow({
  spec,
  index,
  total,
  questions,
  attributeKeys,
  open,
  onToggle,
  onChange,
  onRemove,
  onMove,
}: {
  spec: RuleSpec;
  index: number;
  total: number;
  questions: { id: string; label: string }[];
  attributeKeys: string[];
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<RuleSpec>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const info = RULE_KIND_INFO[spec.kind];
  const question = questions.find((q) => q.id === spec.questionId);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Scale className="h-4 w-4 shrink-0 text-ink-faint" />
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <span className="text-sm font-medium">{info.label}</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-ink-faint">
            {question?.label ?? (spec.questionId || "no question")}
          </span>
          <span className="text-[11px] text-ink-faint">×{spec.weight}</span>
        </button>
        <div className="flex items-center gap-0.5">
          <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn
            label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Delete" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
          <button
            onClick={onToggle}
            className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint hover:bg-white/5"
          >
            <ChevronDown className={cx("h-4 w-4 transition", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-white/5 px-4 py-4">
          <p className="text-[11px] text-ink-faint">{info.blurb}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Rule type">
              <Select
                value={spec.kind}
                onChange={(e) => onChange({ kind: e.target.value as RuleKind })}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {RULE_KIND_INFO[k].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Driven by answer">
              <Select
                value={spec.questionId}
                onChange={(e) => onChange({ questionId: e.target.value })}
              >
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Weight" hint="Higher = more influence">
              <NumberInput
                value={spec.weight}
                min={0}
                step={0.5}
                onValue={(w) => onChange({ weight: w ?? 0 })}
              />
            </Field>
          </div>

          {info.needsAttribute && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Item attribute" hint="Which attribute this rule reads">
                <TextInput
                  list="attr-keys"
                  value={spec.attribute ?? ""}
                  placeholder="e.g. bedrooms"
                  onChange={(e) => onChange({ attribute: e.target.value })}
                />
                <datalist id="attr-keys">
                  {attributeKeys.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
              </Field>
              {info.needsCeiling && (
                <Field label="Ceiling" hint="Best score at 0, no score at this value">
                  <NumberInput
                    value={spec.ceiling}
                    onValue={(ceiling) => onChange({ ceiling })}
                  />
                </Field>
              )}
            </div>
          )}

          {spec.kind !== "budget" && spec.kind !== "investment" && (
            <Field label="Reason" hint={REASON_HINT[spec.kind]}>
              <TextInput
                value={spec.reason ?? ""}
                onChange={(e) => onChange({ reason: e.target.value })}
              />
            </Field>
          )}
        </div>
      )}
    </div>
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
      className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint transition hover:bg-white/5 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

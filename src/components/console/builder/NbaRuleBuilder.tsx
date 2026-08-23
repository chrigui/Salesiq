"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { NBA_FIELD_INFO, type BuyerNbaField } from "@/core/buyerIntelligence/nbaRules";
import type { Condition } from "@/core/types";

const FIELDS = Object.keys(NBA_FIELD_INFO) as BuyerNbaField[];

const OP_LABEL: Record<Condition["op"], string> = {
  gt: "is greater than",
  gte: "is at least",
  lt: "is less than",
  lte: "is at most",
  eq: "equals",
  includes: "includes",
  truthy: "is true",
};

function inputClass() {
  return "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400";
}

function blankCondition(): Condition {
  return { questionId: "unresolvedObjectionCount", op: "gte", value: 1 };
}

/**
 * Copies RulesBuilder.tsx's add/remove/reorder row convention (adapted to
 * the light Buyer Intelligence theme, like SegmentBuilder.tsx) for editing
 * one NBA rule's conditions — every condition must match (AND) for the
 * rule to fire, evaluated by evalCondition against the real buyer state
 * (see src/core/buyerIntelligence/nbaRules.ts).
 */
export function NbaRuleBuilder({
  conditions,
  onChange,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
}) {
  const update = (i: number, patch: Partial<Condition>) =>
    onChange(conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i: number) => onChange(conditions.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= conditions.length) return;
    const next = [...conditions];
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  };
  const add = () => onChange([...conditions, blankCondition()]);

  return (
    <div className="space-y-2">
      {conditions.map((c, i) => {
        const field = c.questionId as BuyerNbaField;
        const info = NBA_FIELD_INFO[field];
        const ops = info?.ops ?? ["eq"];
        return (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2">
            <select
              value={field}
              onChange={(e) => {
                const nextField = e.target.value as BuyerNbaField;
                update(i, { questionId: nextField, op: NBA_FIELD_INFO[nextField].ops[0], value: undefined });
              }}
              className={inputClass()}
            >
              {FIELDS.map((f) => (
                <option key={f} value={f}>
                  {NBA_FIELD_INFO[f].label}
                </option>
              ))}
            </select>

            <select value={c.op} onChange={(e) => update(i, { op: e.target.value as Condition["op"] })} className={inputClass()}>
              {ops.map((op) => (
                <option key={op} value={op}>
                  {OP_LABEL[op]}
                </option>
              ))}
            </select>

            {c.op !== "truthy" && (
              <input
                type={typeof c.value === "boolean" ? "text" : "text"}
                value={c.value === undefined ? "" : String(c.value)}
                onChange={(e) => {
                  const raw = e.target.value;
                  const isNumeric = ["gt", "gte", "lt", "lte"].includes(c.op);
                  update(i, { value: isNumeric ? Number(raw) || 0 : raw });
                }}
                placeholder="Value"
                className={inputClass()}
              />
            )}

            <div className="ml-auto flex items-center gap-0.5">
              <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Move down" disabled={i === conditions.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Remove condition" onClick={() => remove(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </IconBtn>
            </div>
          </div>
        );
      })}
      {conditions.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-sm text-zinc-400">
          No conditions yet — a rule with no conditions never fires.
        </p>
      )}
      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
      >
        <Plus className="h-4 w-4" /> Add condition
      </button>
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
      className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

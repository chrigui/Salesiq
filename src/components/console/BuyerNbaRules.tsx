"use client";

import { useState } from "react";
import { ChevronDown, Lightbulb, Loader2, Plus, Trash2 } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { NbaRuleBuilder } from "@/components/console/builder/NbaRuleBuilder";
import { NBA_FIELD_INFO, type BuyerNbaField } from "@/core/buyerIntelligence/nbaRules";
import type { Condition } from "@/core/types";
import {
  useBuyerNbaRules,
  createBuyerNbaRule,
  updateBuyerNbaRule,
  deleteBuyerNbaRule,
  type BuyerNbaRule,
} from "@/core/store/buyerProfiles";

function conditionSummary(c: Condition): string {
  const label = NBA_FIELD_INFO[c.questionId as BuyerNbaField]?.label ?? c.questionId;
  return c.op === "truthy" ? label : `${label} ${c.op} ${c.value}`;
}

/**
 * Wave 2 configurable Next Best Action. The Wave 1 hardcoded hint stays as
 * the built-in fallback (see resolveNextBestAction) — a tenant that never
 * visits this tab sees no behavior change. Rules evaluate lowest priority
 * number first; the first enabled rule whose conditions all match wins.
 */
export function BuyerNbaRules() {
  const { rules, isLoading } = useBuyerNbaRules();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Panel
      title="Next Best Action rules"
      right={
        !creating && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New rule
          </button>
        )
      }
    >
      <p className="mb-3 text-xs text-zinc-400">
        Custom rules run first, lowest priority number first. When none match, buyers fall back to SalesIQ&apos;s
        built-in hint — untouched tenants see no change.
      </p>

      {creating && <NewRuleForm onDone={() => setCreating(false)} nextPriority={rules.length} />}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rules.length === 0 && !creating ? (
        <p className="py-6 text-center text-sm text-zinc-400">
          No custom rules yet. SalesIQ&apos;s built-in hint covers every buyer until you add one.
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <RuleRow key={r.id} rule={r} open={openId === r.id} onToggle={() => setOpenId(openId === r.id ? null : r.id)} />
          ))}
        </div>
      )}
    </Panel>
  );
}

function NewRuleForm({ onDone, nextPriority }: { onDone: () => void; nextPriority: number }) {
  const [label, setLabel] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [conditions, setConditions] = useState<Condition[]>([{ questionId: "unresolvedObjectionCount", op: "gte", value: 1 }]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!label.trim() || !suggestion.trim() || conditions.length === 0) return;
    setSaving(true);
    await createBuyerNbaRule({ label: label.trim(), priority: nextPriority, conditions, suggestion: suggestion.trim(), enabled: true });
    setSaving(false);
    onDone();
  };

  return (
    <div className="mb-3 space-y-3 rounded-2xl border border-zinc-200 p-4">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Rule name, e.g. Financing objection"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
      />
      <NbaRuleBuilder conditions={conditions} onChange={setConditions} />
      <input
        type="text"
        value={suggestion}
        onChange={(e) => setSuggestion(e.target.value)}
        placeholder="Suggestion, e.g. Unresolved {topObjectionKind} objection — call the buyer directly."
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving || !label.trim() || !suggestion.trim() || conditions.length === 0}
          className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save rule"}
        </button>
        <button onClick={onDone} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

function RuleRow({ rule, open, onToggle }: { rule: BuyerNbaRule; open: boolean; onToggle: () => void }) {
  const [conditions, setConditions] = useState<Condition[]>(rule.conditions);
  const [suggestion, setSuggestion] = useState(rule.suggestion);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(conditions) !== JSON.stringify(rule.conditions) || suggestion !== rule.suggestion;

  const save = async () => {
    setSaving(true);
    await updateBuyerNbaRule(rule.id, { conditions, suggestion });
    setSaving(false);
  };

  const toggleEnabled = () => void updateBuyerNbaRule(rule.id, { enabled: !rule.enabled });
  const remove = () => void deleteBuyerNbaRule(rule.id);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Lightbulb className={cx("h-4 w-4 shrink-0", rule.enabled ? "text-amber-500" : "text-zinc-300")} />
        <button onClick={onToggle} className="flex flex-1 flex-wrap items-center gap-2 text-left">
          <span className="text-sm font-medium text-zinc-900">{rule.label}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            priority {rule.priority}
          </span>
          {rule.conditions.map((c, i) => (
            <span key={i} className="rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-500">
              {conditionSummary(c)}
            </span>
          ))}
        </button>
        <button
          onClick={toggleEnabled}
          className={cx(
            "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
            rule.enabled ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500",
          )}
        >
          {rule.enabled ? "Enabled" : "Disabled"}
        </button>
        <button
          aria-label="Delete rule"
          onClick={remove}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={onToggle} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100">
          <ChevronDown className={cx("h-4 w-4 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-100 px-4 py-4">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Conditions (all must match)</p>
            <NbaRuleBuilder conditions={conditions} onChange={setConditions} />
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Suggestion</p>
            <input
              type="text"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>
          {dirty && (
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

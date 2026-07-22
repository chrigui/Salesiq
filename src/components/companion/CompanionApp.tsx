"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  LayoutGrid,
  GitCompareArrows,
  RotateCcw,
  FileText,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ChevronRight,
  User2,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "@/core/store/session";
import { PACKS, getPack } from "@/core/industries";
import { scoreInventory, isVisible } from "@/core/engine/scoring";
import { formatMoney } from "@/core/engine/explain";
import { Button, cx, Eyebrow } from "@/components/ui/primitives";
import { Icon } from "@/lib/icon";
import type { Question, BudgetValue } from "@/core/types";
import { ProposalSheet } from "./ProposalSheet";
import { CompanionSyncBar } from "@/components/sync/Pairing";

export function CompanionApp() {
  const session = useSession();
  const pack = getPack(session.packId);
  const [activeSection, setActiveSection] = useState(pack.sections[0]?.id);
  const [proposalOpen, setProposalOpen] = useState(false);

  const visibleQuestions = useMemo(
    () =>
      pack.questions.filter(
        (q) => isVisible(q, session.answers) && q.section === activeSection,
      ),
    [pack, session.answers, activeSection],
  );

  const scored = useMemo(
    () => scoreInventory(pack, session.answers),
    [pack, session.answers],
  );
  const answeredCount = pack.questions.filter(
    (q) => session.answers[q.id] !== undefined,
  ).length;

  return (
    <div className="bg-aurora flex min-h-screen justify-center px-4 py-6">
      <div className="glass-strong flex w-full max-w-md flex-col overflow-hidden rounded-[2.2rem] ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand/20 text-brand ring-1 ring-brand/30">
              {pack.branding.logoGlyph}
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">
                Sales Companion
              </div>
              <div className="text-[11px] text-ink-faint">
                {pack.branding.name}
              </div>
            </div>
          </div>
          <Link
            href="/display"
            target="_blank"
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-ink-muted transition hover:bg-white/10"
          >
            Display <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Cross-device pairing status / join */}
        <CompanionSyncBar />

        {/* Industry switcher */}
        <div className="border-b border-white/5 px-5 py-3">
          <Eyebrow>Industry pack</Eyebrow>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {PACKS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  session.setPack(p.id);
                  setActiveSection(p.sections[0]?.id);
                }}
                className={cx(
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                  p.id === session.packId
                    ? "bg-brand text-white"
                    : "bg-white/5 text-ink-muted hover:bg-white/10",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer */}
        <CustomerBlock />

        {/* Section tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/5 px-4 py-2">
          {pack.sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cx(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition",
                s.id === activeSection
                  ? "bg-white/10 text-ink"
                  : "text-ink-faint hover:text-ink-muted",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {visibleQuestions.map((q) => (
            <QuestionControl key={q.id} question={q} />
          ))}
          {visibleQuestions.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-faint">
              No questions in this section yet.
            </p>
          )}
        </div>

        {/* Recommendation peek */}
        {scored[0] && answeredCount > 0 && (
          <button
            onClick={() => session.setView("recommendation")}
            className="mx-5 mb-2 flex items-center justify-between rounded-2xl border border-brand/30 bg-brand/10 px-4 py-3 text-left transition hover:bg-brand/15"
          >
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand">
                <Sparkles className="h-3 w-3" /> Top match · {scored[0].score}
              </div>
              <div className="text-sm font-semibold">{scored[0].item.name}</div>
              <div className="text-xs text-ink-faint">
                {formatMoney(scored[0].item.price, scored[0].item.currency)}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-brand" />
          </button>
        )}

        {/* Action bar */}
        <div className="grid grid-cols-4 gap-1.5 border-t border-white/5 p-3">
          <ActionButton
            icon={Sparkles}
            label="Recommend"
            onClick={() => session.setView("recommendation")}
          />
          <ActionButton
            icon={GitCompareArrows}
            label="Compare"
            onClick={() => session.setView("compare")}
          />
          <ActionButton
            icon={FileText}
            label="Proposal"
            onClick={() => setProposalOpen(true)}
          />
          <ActionButton
            icon={RotateCcw}
            label="Reset"
            onClick={() => {
              session.reset();
              setActiveSection(getPack(session.packId).sections[0]?.id);
            }}
          />
        </div>

        {/* Inventory quick-jump */}
        <div className="border-t border-white/5 px-5 py-3">
          <Eyebrow>Jump to</Eyebrow>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {scored.map((s) => {
              const marked = session.bookmarks.includes(s.item.id);
              return (
                <button
                  key={s.item.id}
                  onClick={() => session.focusItem(s.item.id)}
                  className="group flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-ink-muted transition hover:bg-white/10"
                >
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      session.toggleBookmark(s.item.id);
                    }}
                  >
                    {marked ? (
                      <BookmarkCheck className="h-3.5 w-3.5 text-brand" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70" />
                    )}
                  </span>
                  {s.item.name}
                  <span className="text-ink-faint">{s.score}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ProposalSheet
        open={proposalOpen}
        onClose={() => setProposalOpen(false)}
        pack={pack}
        scored={scored}
      />
    </div>
  );
}

function ActionButton({
  icon: Ic,
  label,
  onClick,
}: {
  icon: typeof Sparkles;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-ink-muted transition hover:bg-white/5 hover:text-ink"
    >
      <Ic className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function CustomerBlock() {
  const { customer, updateCustomer } = useSession();
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5 px-5 py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <User2 className="h-4 w-4 text-ink-faint" />
          <span className="text-sm font-medium">
            {customer.name || "Add customer"}
          </span>
        </div>
        <ChevronRight
          className={cx(
            "h-4 w-4 text-ink-faint transition",
            open && "rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="mt-3 grid gap-2">
          {(
            [
              ["name", "Full name"],
              ["phone", "Phone"],
              ["email", "Email"],
            ] as const
          ).map(([field, ph]) => (
            <input
              key={field}
              value={customer[field]}
              onChange={(e) => updateCustomer({ [field]: e.target.value })}
              placeholder={ph}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-ink-faint focus:border-brand/50"
            />
          ))}
          <textarea
            value={customer.notes}
            onChange={(e) => updateCustomer({ notes: e.target.value })}
            placeholder="Notes…"
            rows={2}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-ink-faint focus:border-brand/50"
          />
        </div>
      )}
    </div>
  );
}

function QuestionControl({ question }: { question: Question }) {
  const { answers, answer, setActiveQuestion } = useSession();
  const value = answers[question.id];

  return (
    <div
      className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5"
      onFocus={() => setActiveQuestion(question.id)}
    >
      <button
        onClick={() => setActiveQuestion(question.id)}
        className="mb-2.5 block text-left text-sm font-medium text-ink"
      >
        {question.label}
      </button>

      {(question.type === "single" || question.type === "multi") && (
        <div className="flex flex-wrap gap-1.5">
          {question.options?.map((opt) => {
            const selected =
              question.type === "multi"
                ? Array.isArray(value) && value.includes(opt.id)
                : value === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (question.type === "multi") {
                    const arr = Array.isArray(value) ? [...value] : [];
                    const next = arr.includes(opt.id)
                      ? arr.filter((v) => v !== opt.id)
                      : [...arr, opt.id];
                    answer(question.id, next);
                  } else {
                    answer(question.id, opt.id);
                  }
                }}
                className={cx(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition",
                  selected
                    ? "bg-brand text-white"
                    : "bg-white/5 text-ink-muted hover:bg-white/10",
                )}
              >
                {opt.icon && <Icon name={opt.icon} className="h-3.5 w-3.5" />}
                {opt.label}
                {selected && question.type === "multi" && (
                  <Check className="h-3 w-3" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "toggle" && (
        <div className="flex gap-2">
          {[
            ["Yes", true],
            ["No", false],
          ].map(([label, v]) => (
            <button
              key={label as string}
              onClick={() => answer(question.id, v as boolean)}
              className={cx(
                "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition",
                value === v
                  ? "bg-brand text-white"
                  : "bg-white/5 text-ink-muted hover:bg-white/10",
              )}
            >
              {label as string}
            </button>
          ))}
        </div>
      )}

      {question.type === "counter" && (
        <Stepper
          value={typeof value === "number" ? value : question.min ?? 0}
          min={question.min ?? 0}
          max={question.max ?? 10}
          onChange={(v) => answer(question.id, v)}
        />
      )}

      {question.type === "slider" && (
        <SingleSlider
          value={typeof value === "number" ? value : question.min ?? 0}
          min={question.min ?? 0}
          max={question.max ?? 100}
          step={question.step ?? 1}
          unit={question.unit}
          onChange={(v) => answer(question.id, v)}
        />
      )}

      {question.type === "budget" && (
        <BudgetControl
          question={question}
          value={
            value && typeof value === "object" && "max" in value
              ? (value as BudgetValue)
              : { min: question.min ?? 0, max: question.max ?? 0 }
          }
          onChange={(v) => answer(question.id, v)}
        />
      )}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-2 py-1.5">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-ink hover:bg-white/10"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white hover:brightness-110"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function SingleSlider({
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-semibold text-brand">
        {value.toLocaleString()} {unit}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[rgb(var(--brand))]"
      />
    </div>
  );
}

function BudgetControl({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: BudgetValue;
  onChange: (v: BudgetValue) => void;
}) {
  const min = question.min ?? 0;
  const max = question.max ?? 100;
  const step = question.step ?? 1000;
  const unit = question.unit ?? "USD";
  return (
    <div>
      <div className="mb-1.5 text-sm font-semibold text-brand">
        {formatMoney(value.min, unit)} – {formatMoney(value.max, unit)}
      </div>
      <div className="space-y-1.5">
        <div>
          <span className="text-[10px] text-ink-faint">Min</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value.min}
            onChange={(e) =>
              onChange({
                min: Math.min(Number(e.target.value), value.max),
                max: value.max,
              })
            }
            className="w-full accent-[rgb(var(--brand))]"
          />
        </div>
        <div>
          <span className="text-[10px] text-ink-faint">Max</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value.max}
            onChange={(e) =>
              onChange({
                min: value.min,
                max: Math.max(Number(e.target.value), value.min),
              })
            }
            className="w-full accent-[rgb(var(--brand))]"
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  GripVertical,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { cx } from "@/components/ui/primitives";
import { getEffectivePack, saveQuestions, slugify } from "@/core/store/packs";
import type { Question, QuestionOption, QuestionType } from "@/core/types";
import { Field, NumberInput, Select, TextArea, TextInput } from "./fields";

const TYPE_LABELS: Record<QuestionType, string> = {
  single: "Single choice",
  multi: "Multiple choice",
  toggle: "Yes / No",
  counter: "Number stepper",
  slider: "Slider",
  budget: "Budget range",
};

const hasOptions = (t: QuestionType) => t === "single" || t === "multi";
const hasRange = (t: QuestionType) =>
  t === "counter" || t === "slider" || t === "budget";

function blankQuestion(sectionId: string): Question {
  return {
    id: `question-${Math.random().toString(36).slice(2, 7)}`,
    label: "New question",
    prompt: "What would you like to ask?",
    type: "single",
    section: sectionId,
    options: [
      { id: "option-1", label: "Option one" },
      { id: "option-2", label: "Option two" },
    ],
  };
}

export function QuestionBuilder({ packId }: { packId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const sections = getEffectivePack(packId).sections;

  // Load the effective questions whenever the edited pack changes.
  useEffect(() => {
    setQuestions(getEffectivePack(packId).questions);
    setOpenId(null);
  }, [packId]);

  // Persist to the draft; the companion/display pick it up live.
  const commit = (next: Question[]) => {
    setQuestions(next);
    saveQuestions(packId, next);
  };

  const update = (id: string, patch: Partial<Question>) =>
    commit(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const remove = (id: string) => commit(questions.filter((q) => q.id !== id));

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= questions.length) return;
    const next = [...questions];
    [next[index], next[to]] = [next[to], next[index]];
    commit(next);
  };

  const add = () => {
    const q = blankQuestion(sections[0]?.id ?? "general");
    commit([...questions, q]);
    setOpenId(q.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-faint">
          {questions.length} question{questions.length === 1 ? "" : "s"} · edits
          go live on the companion and display instantly
        </p>
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add question
        </button>
      </div>

      <div className="space-y-2">
        {questions.map((q, i) => (
          <QuestionRow
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            sections={sections}
            open={openId === q.id}
            onToggle={() => setOpenId(openId === q.id ? null : q.id)}
            onChange={(patch) => update(q.id, patch)}
            onRemove={() => remove(q.id)}
            onMove={(dir) => move(i, dir)}
          />
        ))}
        {questions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-ink-faint">
            No questions yet. Add one to start building the flow.
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionRow({
  question: q,
  index,
  total,
  sections,
  open,
  onToggle,
  onChange,
  onRemove,
  onMove,
}: {
  question: Question;
  index: number;
  total: number;
  sections: { id: string; label: string }[];
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Question>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="h-4 w-4 shrink-0 text-ink-faint" />
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <span className="text-sm font-medium">{q.label || "Untitled"}</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-ink-faint">
            {TYPE_LABELS[q.type]}
          </span>
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
            <ChevronDown
              className={cx("h-4 w-4 transition", open && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-white/5 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label" hint="Shown on the companion controller">
              <TextInput
                value={q.label}
                onChange={(e) => onChange({ label: e.target.value })}
              />
            </Field>
            <Field label="Type">
              <Select
                value={q.type}
                onChange={(e) =>
                  onChange(retypeQuestion(q, e.target.value as QuestionType))
                }
              >
                {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Prompt" hint="Full question shown on the customer display">
            <TextArea
              rows={2}
              value={q.prompt}
              onChange={(e) => onChange({ prompt: e.target.value })}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Section">
              <Select
                value={q.section}
                onChange={(e) => onChange({ section: e.target.value })}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Weight" hint="How strongly this answer influences ranking">
              <NumberInput
                value={q.weight}
                min={0}
                step={0.5}
                placeholder="1"
                onValue={(weight) => onChange({ weight })}
              />
            </Field>
          </div>

          {hasRange(q.type) && (
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Min">
                <NumberInput value={q.min} onValue={(min) => onChange({ min })} />
              </Field>
              <Field label="Max">
                <NumberInput value={q.max} onValue={(max) => onChange({ max })} />
              </Field>
              <Field label="Step">
                <NumberInput value={q.step} onValue={(step) => onChange({ step })} />
              </Field>
              <Field label="Unit">
                <TextInput
                  value={q.unit ?? ""}
                  placeholder="USD"
                  onChange={(e) => onChange({ unit: e.target.value || undefined })}
                />
              </Field>
            </div>
          )}

          {hasOptions(q.type) && (
            <OptionsEditor
              options={q.options ?? []}
              onChange={(options) => onChange({ options })}
            />
          )}
        </div>
      )}
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: QuestionOption[];
  onChange: (next: QuestionOption[]) => void;
}) {
  const setLabel = (i: number, label: string) => {
    const next = options.map((o, idx) =>
      idx === i ? { ...o, label, id: slugify(label, o.id) } : o,
    );
    onChange(next);
  };
  const setIcon = (i: number, icon: string) =>
    onChange(options.map((o, idx) => (idx === i ? { ...o, icon: icon || undefined } : o)));
  const remove = (i: number) => onChange(options.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([
      ...options,
      { id: `option-${options.length + 1}`, label: `Option ${options.length + 1}` },
    ]);

  return (
    <Field label="Options">
      <div className="space-y-2">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={o.label}
              onChange={(e) => setLabel(i, e.target.value)}
              placeholder="Label"
              className="flex-1"
            />
            <TextInput
              value={o.icon ?? ""}
              onChange={(e) => setIcon(i, e.target.value)}
              placeholder="Icon (e.g. Home)"
              className="w-40"
            />
            <button
              onClick={() => remove(i)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-white/5 hover:text-rose-300"
              aria-label="Remove option"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-muted transition hover:bg-white/5"
        >
          <Plus className="h-3.5 w-3.5" /> Add option
        </button>
      </div>
    </Field>
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

/** When the type changes, add/strip the fields that type needs. */
function retypeQuestion(q: Question, type: QuestionType): Partial<Question> {
  const patch: Partial<Question> = { type };
  if (hasOptions(type) && !(q.options && q.options.length)) {
    patch.options = [
      { id: "option-1", label: "Option one" },
      { id: "option-2", label: "Option two" },
    ];
  }
  if (hasRange(type) && q.min == null && q.max == null) {
    patch.min = 0;
    patch.max = type === "budget" ? 1_000_000 : 10;
    patch.step = type === "budget" ? 10_000 : 1;
  }
  return patch;
}

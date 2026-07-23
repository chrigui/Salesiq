"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Plus, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { cx, GRADIENTS } from "@/components/ui/primitives";
import { getEffectivePack, saveInventory } from "@/core/store/packs";
import type { InventoryItem } from "@/core/types";
import { Field, NumberInput, TextInput } from "./fields";
import { LifestyleEditor } from "./LifestyleEditor";

const GRADIENT_TOKENS = Object.keys(GRADIENTS);

function blankItem(currency: string): InventoryItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 7)}`,
    name: "New item",
    subtitle: "",
    price: 100000,
    currency,
    image: "violet",
    attributes: {},
    highlights: [],
  };
}

export function InventoryBuilder({ packId }: { packId: string }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const currency = getEffectivePack(packId).currency;

  useEffect(() => {
    setItems(getEffectivePack(packId).inventory);
    setOpenId(null);
  }, [packId]);

  const commit = (next: InventoryItem[]) => {
    setItems(next);
    saveInventory(packId, next);
  };

  const update = (id: string, patch: Partial<InventoryItem>) =>
    commit(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const remove = (id: string) => commit(items.filter((it) => it.id !== id));

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[index], next[to]] = [next[to], next[index]];
    commit(next);
  };

  const add = () => {
    const it = blankItem(currency);
    commit([...items, it]);
    setOpenId(it.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-faint">
          {items.length} item{items.length === 1 ? "" : "s"} · scored live
          against every customer&apos;s answers
        </p>
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add item
        </button>
      </div>

      <div className="space-y-2">
        {items.map((it, i) => (
          <ItemRow
            key={it.id}
            item={it}
            index={i}
            total={items.length}
            open={openId === it.id}
            onToggle={() => setOpenId(openId === it.id ? null : it.id)}
            onChange={(patch) => update(it.id, patch)}
            onRemove={() => remove(it.id)}
            onMove={(dir) => move(i, dir)}
          />
        ))}
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-ink-faint">
            No inventory yet. Add an item to see it scored on the display.
          </div>
        )}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  index,
  total,
  open,
  onToggle,
  onChange,
  onRemove,
  onMove,
}: {
  item: InventoryItem;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<InventoryItem>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className={cx(
            "h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br",
            GRADIENTS[item.image] ?? GRADIENTS.violet,
          )}
        />
        <button onClick={onToggle} className="flex-1 text-left">
          <div className="text-sm font-medium">{item.name || "Untitled"}</div>
          <div className="text-[11px] text-ink-faint">
            {item.currency} {item.price.toLocaleString()}
            {item.subtitle ? ` · ${item.subtitle}` : ""}
          </div>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <TextInput
                value={item.name}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </Field>
            <Field label="Subtitle">
              <TextInput
                value={item.subtitle}
                onChange={(e) => onChange({ subtitle: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Price">
              <NumberInput
                value={item.price}
                min={0}
                onValue={(price) => onChange({ price: price ?? 0 })}
              />
            </Field>
            <Field label="Currency">
              <TextInput
                value={item.currency}
                maxLength={3}
                onChange={(e) =>
                  onChange({ currency: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field label="Appreciation %" hint="Optional, used by investment scoring">
              <NumberInput
                value={item.appreciation}
                onValue={(appreciation) => onChange({ appreciation })}
              />
            </Field>
          </div>

          <Field label="Photo URL" hint="Falls back to the gradient if it fails to load">
            <TextInput
              value={item.photo ?? ""}
              placeholder="https://…"
              onChange={(e) => onChange({ photo: e.target.value || undefined })}
            />
          </Field>

          <Field label="Accent gradient">
            <div className="flex flex-wrap gap-2">
              {GRADIENT_TOKENS.map((token) => (
                <button
                  key={token}
                  onClick={() => onChange({ image: token })}
                  className={cx(
                    "h-8 w-12 rounded-lg bg-gradient-to-br ring-2 transition",
                    GRADIENTS[token],
                    item.image === token
                      ? "ring-brand"
                      : "ring-transparent hover:ring-white/20",
                  )}
                  aria-label={token}
                />
              ))}
            </div>
          </Field>

          <HighlightsEditor
            highlights={item.highlights}
            onChange={(highlights) => onChange({ highlights })}
          />

          <AttributesEditor
            attributes={item.attributes}
            onChange={(attributes) => onChange({ attributes })}
          />

          <LifestyleEditor
            lifestyle={item.lifestyle}
            onChange={(lifestyle) => onChange({ lifestyle })}
          />
        </div>
      )}
    </div>
  );
}

function HighlightsEditor({
  highlights,
  onChange,
}: {
  highlights: string[];
  onChange: (next: string[]) => void;
}) {
  const set = (i: number, v: string) =>
    onChange(highlights.map((h, idx) => (idx === i ? v : h)));
  const remove = (i: number) => onChange(highlights.filter((_, idx) => idx !== i));
  const add = () => onChange([...highlights, ""]);
  return (
    <Field label="Highlights" hint="Bullet points surfaced on the card">
      <div className="space-y-2">
        {highlights.map((h, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={h}
              onChange={(e) => set(i, e.target.value)}
              className="flex-1"
            />
            <button
              onClick={() => remove(i)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-white/5 hover:text-rose-300"
              aria-label="Remove highlight"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-muted transition hover:bg-white/5"
        >
          <Plus className="h-3.5 w-3.5" /> Add highlight
        </button>
      </div>
    </Field>
  );
}

type AttrValue = number | string | boolean;

/** Coerce a free-text value into the number / boolean / string the engine uses. */
function coerceAttr(raw: string): AttrValue {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t !== "" && !Number.isNaN(Number(t))) return Number(t);
  return raw;
}

function AttributesEditor({
  attributes,
  onChange,
}: {
  attributes: Record<string, AttrValue>;
  onChange: (next: Record<string, AttrValue>) => void;
}) {
  const entries = Object.entries(attributes);

  const rebuild = (rows: [string, AttrValue][]) => {
    const obj: Record<string, AttrValue> = {};
    for (const [k, v] of rows) if (k.trim()) obj[k.trim()] = v;
    onChange(obj);
  };
  const setKey = (i: number, key: string) =>
    rebuild(entries.map((e, idx) => (idx === i ? [key, e[1]] : e)));
  const setVal = (i: number, val: string) =>
    rebuild(entries.map((e, idx) => (idx === i ? [e[0], coerceAttr(val)] : e)));
  const remove = (i: number) => rebuild(entries.filter((_, idx) => idx !== i));
  const add = () => rebuild([...entries, ["attribute", ""]]);

  return (
    <Field
      label="Attributes"
      hint="Matched by the scoring rules (e.g. bedrooms: 4, seaView: true)"
    >
      <div className="space-y-2">
        {entries.map(([k, v], i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={k}
              onChange={(e) => setKey(i, e.target.value)}
              placeholder="key"
              className="w-40"
            />
            <TextInput
              value={String(v)}
              onChange={(e) => setVal(i, e.target.value)}
              placeholder="value"
              className="flex-1"
            />
            <button
              onClick={() => remove(i)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-white/5 hover:text-rose-300"
              aria-label="Remove attribute"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-muted transition hover:bg-white/5"
        >
          <Plus className="h-3.5 w-3.5" /> Add attribute
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

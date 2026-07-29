"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowRight, Boxes, Lock, X } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { PACKS } from "@/core/industries";
import { getEffectivePack, resetPack } from "@/core/store/packs";
import {
  createCustomPack,
  deleteCustomPack,
  useCustomPacks,
} from "@/core/data/customPacks";
import { Field, TextInput } from "@/components/console/builder/fields";

const PALETTE = [
  { brand: "99 102 241", soft: "129 140 248" }, // indigo
  { brand: "16 185 129", soft: "52 211 153" }, // emerald
  { brand: "244 63 94", soft: "251 113 133" }, // rose
  { brand: "234 179 8", soft: "250 204 21" }, // amber
  { brand: "56 189 248", soft: "125 211 252" }, // sky
  { brand: "168 85 247", soft: "192 132 252" }, // violet
];

/**
 * Industry Builder (Module 9) — "create new industries without code." Every
 * shipped pack (Real Estate, Automotive, Private Jets) started life as this
 * same shape: an identity, a set of questions, an inventory, and scoring
 * rules. A new custom pack starts as an empty shell with that identity only;
 * the tenant fills it in with the Questions/Inventory/Scoring/Branding tabs
 * already built for the shipped packs — nothing there needed to change.
 */
export function IndustryBuilder({
  onOpenBuilder,
}: {
  onOpenBuilder: (packId: string) => void;
}) {
  const custom = useCustomPacks();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Panel
        title="Your industries"
        right={
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Create industry
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PACKS.map((p) => {
            const eff = getEffectivePack(p.id);
            return (
              <PackCard
                key={p.id}
                id={p.id}
                label={p.label}
                vertical={p.vertical}
                glyph={p.branding.logoGlyph}
                brand={p.branding.brand}
                questionCount={eff.questions.length}
                itemCount={eff.inventory.length}
                shipped
                onOpen={() => onOpenBuilder(p.id)}
              />
            );
          })}
          {custom.map((p) => {
            const eff = getEffectivePack(p.id);
            return (
              <PackCard
                key={p.id}
                id={p.id}
                label={p.label}
                vertical={p.vertical}
                glyph={p.branding.logoGlyph}
                brand={p.branding.brand}
                questionCount={eff.questions.length}
                itemCount={eff.inventory.length}
                shipped={false}
                onOpen={() => onOpenBuilder(p.id)}
                onDelete={() => {
                  if (
                    confirm(
                      `Delete "${p.label}"? This removes its questions, inventory and rules permanently.`,
                    )
                  ) {
                    resetPack(p.id);
                    deleteCustomPack(p.id);
                  }
                }}
              />
            );
          })}
        </div>
        {custom.length === 0 && (
          <p className="mt-4 text-center text-xs text-zinc-400">
            {PACKS.length} shipped industr{PACKS.length === 1 ? "y" : "ies"} · create your own to add a new vertical without code
          </p>
        )}
      </Panel>

      {createOpen && (
        <CreateIndustryModal
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => {
            setCreateOpen(false);
            onOpenBuilder(id);
          }}
        />
      )}
    </div>
  );
}

function PackCard({
  label,
  vertical,
  glyph,
  brand,
  questionCount,
  itemCount,
  shipped,
  onOpen,
  onDelete,
}: {
  id: string;
  label: string;
  vertical: string;
  glyph: string;
  brand: string;
  questionCount: number;
  itemCount: number;
  shipped: boolean;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-2 flex items-start justify-between">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl text-lg"
          style={{ background: `rgb(${brand} / 0.15)`, color: `rgb(${brand})` }}
        >
          {glyph}
        </span>
        {shipped ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
            <Lock className="h-2.5 w-2.5" /> Shipped
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            Custom
          </span>
        )}
      </div>
      <div className="text-sm font-semibold text-zinc-900">{label}</div>
      <div className="mb-3 text-xs text-zinc-400">{vertical}</div>
      <div className="mb-3 flex gap-3 text-xs text-zinc-500">
        <span>{questionCount} question{questionCount === 1 ? "" : "s"}</span>
        <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
      </div>
      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={onOpen}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          Open builder <ArrowRight className="h-3.5 w-3.5" />
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            aria-label={`Delete ${label}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function CreateIndustryModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (packId: string) => void;
}) {
  const custom = useCustomPacks();
  const [label, setLabel] = useState("");
  const [vertical, setVertical] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [glyph, setGlyph] = useState("◆");
  const [tagline, setTagline] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);

  const valid = label.trim().length > 0 && vertical.trim().length > 0;

  const create = () => {
    if (!valid) return;
    const existingIds = [...PACKS.map((p) => p.id), ...custom.map((p) => p.id)];
    const pack = createCustomPack(
      {
        label: label.trim(),
        vertical: vertical.trim(),
        currency,
        branding: {
          name: label.trim(),
          tagline: tagline.trim() || `Find the right fit, every time.`,
          brand: PALETTE[paletteIndex].brand,
          brandSoft: PALETTE[paletteIndex].soft,
          logoGlyph: glyph.trim() || "◆",
        },
      },
      existingIds,
    );
    onCreated(pack.id);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-zinc-900" />
            <h3 className="text-base font-semibold text-zinc-900">Create an industry</h3>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Industry name" hint="e.g. Yacht Charter, Solar Installation">
            <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Yacht Charter" />
          </Field>
          <Field label="Vertical description" hint="Shown to the AI engine as context">
            <TextInput
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              placeholder="luxury yacht charter and sales"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Logo glyph">
              <TextInput value={glyph} maxLength={2} onChange={(e) => setGlyph(e.target.value)} />
            </Field>
            <Field label="Currency">
              <TextInput
                value={currency}
                maxLength={3}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
            </Field>
          </div>
          <Field label="Tagline" hint="Optional — you can change this later">
            <TextInput value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Find the right fit, every time." />
          </Field>
          <Field label="Brand colour">
            <div className="flex gap-2">
              {PALETTE.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setPaletteIndex(i)}
                  aria-label={`Colour ${i + 1}`}
                  className={cx(
                    "h-8 w-8 rounded-full ring-2 transition",
                    paletteIndex === i ? "ring-zinc-900" : "ring-transparent",
                  )}
                  style={{ background: `rgb(${c.brand})` }}
                />
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50">
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={create}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            Create &amp; start building
          </button>
        </div>
      </div>
    </div>
  );
}

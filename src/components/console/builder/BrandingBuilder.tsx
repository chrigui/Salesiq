"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getEffectivePack, saveBranding } from "@/core/store/packs";
import type { Branding } from "@/core/types";
import { Field, TextInput } from "./fields";

/** "16 185 129" <-> "#10b981" so an <input type=color> can drive the triplet. */
function tripletToHex(triplet: string): string {
  const [r, g, b] = triplet.trim().split(/\s+/).map((n) => Number(n) || 0);
  const hex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
function hexToTriplet(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) || 0;
  const g = parseInt(m.slice(2, 4), 16) || 0;
  const b = parseInt(m.slice(4, 6), 16) || 0;
  return `${r} ${g} ${b}`;
}

export function BrandingBuilder({ packId }: { packId: string }) {
  const [branding, setBranding] = useState<Branding | null>(null);

  useEffect(() => {
    setBranding(getEffectivePack(packId).branding);
  }, [packId]);

  if (!branding) return null;

  const update = (patch: Partial<Branding>) => {
    const next = { ...branding, ...patch };
    setBranding(next);
    saveBranding(packId, next);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company name">
            <TextInput
              value={branding.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>
          <Field label="Logo glyph" hint="A character or emoji used as the mark">
            <TextInput
              value={branding.logoGlyph}
              maxLength={2}
              onChange={(e) => update({ logoGlyph: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Tagline">
          <TextInput
            value={branding.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <ColorField
            label="Brand colour"
            triplet={branding.brand}
            onChange={(brand) => update({ brand })}
          />
          <ColorField
            label="Accent colour"
            triplet={branding.brandSoft}
            onChange={(brandSoft) => update({ brandSoft })}
          />
        </div>
        <p className="text-[11px] text-ink-faint">
          Colours apply live across the companion and display for this pack.
        </p>
      </div>

      <BrandPreview branding={branding} />
    </div>
  );
}

function ColorField({
  label,
  triplet,
  onChange,
}: {
  label: string;
  triplet: string;
  onChange: (triplet: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={tripletToHex(triplet)}
          onChange={(e) => onChange(hexToTriplet(e.target.value))}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent"
          aria-label={label}
        />
        <TextInput
          value={triplet}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </Field>
  );
}

/** A live mini customer-display header using the edited colours. */
function BrandPreview({ branding }: { branding: Branding }) {
  const brand = `rgb(${branding.brand.trim().split(/\s+/).join(" ")})`;
  const soft = `rgb(${branding.brandSoft.trim().split(/\s+/).join(" ")})`;
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 p-6"
      style={{
        background: `radial-gradient(120% 90% at 20% 0%, ${brand}22, transparent 60%), rgba(10,10,12,0.6)`,
      }}
    >
      <div className="mb-5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        Live preview
      </div>
      <div className="flex items-center gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-2xl text-xl"
          style={{ background: `${brand}33`, color: brand }}
        >
          {branding.logoGlyph}
        </div>
        <div>
          <div className="text-lg font-semibold tracking-tight">{branding.name}</div>
          <div className="text-xs text-ink-faint">{branding.tagline}</div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: brand }}
        >
          <Sparkles className="h-4 w-4" /> Recommend
        </button>
        <span
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: `${soft}22`, color: soft }}
        >
          Top match · 92
        </span>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full"
          style={{ width: "78%", background: `linear-gradient(90deg, ${brand}, ${soft})` }}
        />
      </div>
    </div>
  );
}

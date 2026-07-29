"use client";

import { useState } from "react";
import {
  ArrowRight,
  Palette,
  Check,
  Glasses,
  Radio,
  Box,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useAllPacks } from "@/core/store/packs";
import { getEffectivePack, saveBranding } from "@/core/store/packs";

const THEMES = [
  { name: "Midnight", brand: "24 24 27", soft: "63 63 70" },
  { name: "Indigo", brand: "99 102 241", soft: "129 140 248" },
  { name: "Emerald", brand: "16 185 129", soft: "52 211 153" },
  { name: "Rose", brand: "244 63 94", soft: "251 113 133" },
  { name: "Amber", brand: "234 179 8", soft: "250 204 21" },
  { name: "Sky", brand: "56 189 248", soft: "125 211 252" },
];

const ROADMAP = [
  { icon: Glasses, name: "Apple Vision Pro", blurb: "Spatial recommendation walkthroughs.", priority: 2 },
  { icon: Box, name: "AR Experience", blurb: "Point a phone at a room, see the product in it.", priority: 2 },
  { icon: SparklesIcon, name: "VR Experience", blurb: "Full-immersion showroom walkthroughs.", priority: 2 },
  { icon: Radio, name: "IoT Integration", blurb: "Live inventory/sensor feeds into scoring.", priority: 2 },
  { icon: Box, name: "Digital Twin", blurb: "A live 3D model of the physical inventory.", priority: 2 },
];

/**
 * Marketplace (Module 12 · Future Platform). Industry Packs and Themes are
 * real, working actions today; the Roadmap section below is exactly that —
 * planned, not built, shown honestly rather than faked.
 */
export function Marketplace({ onOpenPack }: { onOpenPack: (packId: string) => void }) {
  const packs = useAllPacks();
  const [applyPackId, setApplyPackId] = useState(packs[0]?.id ?? "");
  const [appliedTheme, setAppliedTheme] = useState<string | null>(null);

  const applyTheme = (theme: (typeof THEMES)[number]) => {
    if (!applyPackId) return;
    const current = getEffectivePack(applyPackId);
    saveBranding(applyPackId, { ...current.branding, brand: theme.brand, brandSoft: theme.soft });
    setAppliedTheme(theme.name);
    window.setTimeout(() => setAppliedTheme((t) => (t === theme.name ? null : t)), 1800);
  };

  return (
    <div className="space-y-4">
      <Panel title="Industry packs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4">
              <span
                className="mb-2 grid h-10 w-10 place-items-center rounded-xl text-lg"
                style={{ background: `rgb(${p.branding.brand} / 0.15)`, color: `rgb(${p.branding.brand})` }}
              >
                {p.branding.logoGlyph}
              </span>
              <div className="text-sm font-semibold text-zinc-900">{p.label}</div>
              <div className="mb-3 text-xs text-zinc-400">{p.vertical}</div>
              <button
                onClick={() => onOpenPack(p.id)}
                className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Open in builder <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Themes">
        <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
          <Palette className="h-4 w-4" />
          Apply a color theme to
          <select
            value={applyPackId}
            onChange={(e) => setApplyPackId(e.target.value)}
            className="rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
          >
            {packs.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {THEMES.map((t) => (
            <button
              key={t.name}
              onClick={() => applyTheme(t)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300"
            >
              <span className="h-10 w-10 rounded-full" style={{ background: `rgb(${t.brand})` }} />
              <span className="text-xs font-medium text-zinc-700">{t.name}</span>
              {appliedTheme === t.name && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                  <Check className="h-3 w-3" /> Applied
                </span>
              )}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Roadmap">
        <p className="mb-4 text-sm text-zinc-500">
          Planned, not built — shown here so it's clear what's real above
          this line and what isn't.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROADMAP.map((r) => (
            <div key={r.name} className="flex items-start gap-3 rounded-2xl border border-dashed border-zinc-200 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-400">
                <r.icon className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700">{r.name}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                    Planned
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-400">{r.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

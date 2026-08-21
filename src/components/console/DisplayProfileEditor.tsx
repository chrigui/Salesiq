"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { ArrowLeft, ArrowUp, ArrowDown, Loader2, Eye, Upload, FileText, Trash2 } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { Field, TextInput } from "@/components/console/builder/fields";
import { PACKS } from "@/core/industries";
import {
  useDisplayProfile,
  updateDisplayProfile,
  type DisplayProfile,
  type DisplayTemplate,
} from "@/core/store/displayProfiles";
import { WIDGET_LABELS } from "@/components/display/registry";
import { useBrandProfiles } from "@/core/store/brandProfiles";
import { DisplayProfileRenderer } from "@/components/display/DisplayProfileRenderer";
import type { IndustryPack, InventoryItem } from "@/core/types";

const TABS = ["Widgets", "Brand", "Preview"] as const;
type Tab = (typeof TABS)[number];

const TEMPLATES: DisplayTemplate[] = [
  "Minimal",
  "NewDevelopment",
  "Detailed",
  "Lifestyle",
  "Investment",
  "LuxuryCinematic",
  "Masterplan",
  "Custom",
];

export function DisplayProfileEditor({ id, onBack }: { id: string; onBack: () => void }) {
  const { profile, isLoading } = useDisplayProfile(id);
  const [tab, setTab] = useState<Tab>("Widgets");

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading display profile…
      </div>
    );
  }

  const pack = PACKS.find((p) => p.id === profile.packId);
  const item = pack?.inventory.find((i) => i.id === profile.itemId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <div className="text-base font-semibold text-zinc-900">{profile.name}</div>
          <div className="text-xs text-zinc-400">
            {item?.name ?? "Listing removed"} · {pack?.label ?? profile.packId}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={profile.status}
            onChange={(e) => {
              const status = e.target.value as DisplayProfile["status"];
              updateDisplayProfile(id, { status });
            }}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
          <button
            onClick={() => setTab("Preview")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Eye className="h-4 w-4" /> Preview
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "px-3 py-2 text-sm font-medium transition",
              tab === t ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Widgets" && <WidgetsTab id={id} profile={profile} />}
      {tab === "Brand" && <BrandTab id={id} profile={profile} />}
      {tab === "Preview" && pack && item && <PreviewTab profile={profile} pack={pack} item={item} />}
    </div>
  );
}

function WidgetsTab({ id, profile }: { id: string; profile: DisplayProfile }) {
  const [sections, setSections] = useState(profile.sections);
  useEffect(() => setSections(profile.sections), [profile.sections]);

  const commit = (next: typeof sections) => {
    setSections(next);
    updateDisplayProfile(id, { sections: next });
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    [next[index], next[to]] = [next[to], next[index]];
    commit(next.map((s, i) => ({ ...s, order: i })));
  };

  const toggle = (idx: number) =>
    commit(sections.map((s, i) => (i === idx ? { ...s, enabled: !s.enabled } : s)));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Widgets">
        <div className="space-y-2">
          {sections.map((s, i) => (
            <div
              key={s.id}
              className={cx(
                "flex items-center gap-2 rounded-2xl border px-3 py-2.5",
                s.enabled ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50",
              )}
            >
              <label className="flex flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={() => toggle(i)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span className={cx("text-sm font-medium", !s.enabled && "text-zinc-400")}>
                  {WIDGET_LABELS[s.type] ?? s.type}
                </span>
              </label>
              <div className="flex items-center gap-0.5">
                <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Move down" disabled={i === sections.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </IconBtn>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Template">
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t}
              onClick={() => updateDisplayProfile(id, { template: t })}
              className={cx(
                "rounded-xl border px-3 py-2 text-sm font-medium transition",
                profile.template === t
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-zinc-400">
          Templates are starting points, not locked designs — switching template doesn&apos;t change the widgets
          above once you&apos;ve edited them.
        </p>
      </Panel>

      <DocumentsPanel profileId={id} />
    </div>
  );
}

interface AssetMeta {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ALLOWED_UPLOAD_MIME = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Upload/manage the profile's Documents — feeds the Masterplan widget (first image) and Documents widget (full list). Real bytes stored via /api/display-profiles/[id]/assets, same pattern as the Brochure module's asset storage. */
function DocumentsPanel({ profileId }: { profileId: string }) {
  const key = `/api/display-profiles/${profileId}/assets`;
  const { data, isLoading } = useSWR<{ assets: AssetMeta[] }>(key, (url: string) =>
    fetch(url).then((res) => res.json()),
  );
  const assets = data?.assets ?? [];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    if (!ALLOWED_UPLOAD_MIME.has(file.type)) {
      setError("Only PDF, PNG, JPEG or WEBP files are supported.");
      return;
    }
    setUploading(true);
    const dataBase64 = await fileToBase64(file);
    const res = await fetch(key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, mimeType: file.type, dataBase64 }),
    });
    setUploading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error === "file-too-large" ? "File is larger than 8MB." : "Upload failed.");
      return;
    }
    globalMutate(key);
  };

  const handleDelete = async (assetId: string) => {
    await fetch(`${key}/${assetId}`, { method: "DELETE" });
    globalMutate(key);
  };

  return (
    <Panel title="Documents">
      <p className="mb-3 text-xs text-zinc-400">
        Floor plans, masterplans, spec sheets. The first uploaded image also feeds the Masterplan widget.
      </p>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Uploading…" : "Upload a document"}
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {isLoading ? (
        <div className="mt-3 flex items-center justify-center gap-2 py-4 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : assets.length > 0 ? (
        <div className="mt-3 space-y-2">
          {assets.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
              <span className="flex-1 truncate text-sm text-zinc-700">{a.name}</span>
              <span className="shrink-0 text-xs text-zinc-400">{formatSize(a.sizeBytes)}</span>
              <button
                onClick={() => handleDelete(a.id)}
                aria-label="Delete document"
                className="shrink-0 text-zinc-300 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

/** "16 185 129" <-> "#10b981" so an <input type=color> can drive the triplet — same conversion as the Branding builder. */
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

function BrandTab({ id, profile }: { id: string; profile: DisplayProfile }) {
  const pack = PACKS.find((p) => p.id === profile.packId);
  const { brandProfiles } = useBrandProfiles();
  const attachedBrandProfile = brandProfiles.find((bp) => bp.id === profile.brandProfileId);
  const fallbackBrand = profile.resolvedBrandProfile?.brand ?? pack?.branding.brand ?? "16 185 129";
  const fallbackSoft = profile.resolvedBrandProfile?.brandSoft ?? pack?.branding.brandSoft ?? "52 211 153";

  const [brand, setBrand] = useState(profile.brandOverrides?.brand ?? fallbackBrand);
  const [brandSoft, setBrandSoft] = useState(profile.brandOverrides?.brandSoft ?? fallbackSoft);
  useEffect(() => {
    setBrand(profile.brandOverrides?.brand ?? fallbackBrand);
    setBrandSoft(profile.brandOverrides?.brandSoft ?? fallbackSoft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  const commit = (patch: { brand?: string; brandSoft?: string }) => {
    const nextBrand = patch.brand ?? brand;
    const nextSoft = patch.brandSoft ?? brandSoft;
    setBrand(nextBrand);
    setBrandSoft(nextSoft);
    updateDisplayProfile(id, { brandOverrides: { brand: nextBrand, brandSoft: nextSoft } });
  };

  const resetToPackBranding = () => {
    setBrand(fallbackBrand);
    setBrandSoft(fallbackSoft);
    updateDisplayProfile(id, { brandOverrides: null });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Brand profile">
        <div className="space-y-3">
          <Field label="Attached brand kit">
            <select
              value={profile.brandProfileId ?? ""}
              onChange={(e) => updateDisplayProfile(id, { brandProfileId: e.target.value || null })}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="">None — use {pack?.label ?? "pack"} branding</option>
              {brandProfiles.map((bp) => (
                <option key={bp.id} value={bp.id}>
                  {bp.name}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-[11px] text-zinc-400">
            {attachedBrandProfile
              ? `Colors below start from "${attachedBrandProfile.name}" — edit it from Display Studio's Brand tab to update every profile using it, or override just this one below.`
              : `Manage the tenant's brand kit library from Display Studio's Brand tab.`}
          </p>
        </div>
      </Panel>
      <Panel title="Colors on this profile">
        <div className="space-y-3">
          <Field label="Primary color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={tripletToHex(brand)}
                onChange={(e) => commit({ brand: hexToTriplet(e.target.value) })}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-transparent"
                aria-label="Primary color"
              />
              <TextInput value={brand} onChange={(e) => commit({ brand: e.target.value })} className="flex-1" />
            </div>
          </Field>
          <Field label="Secondary / accent color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={tripletToHex(brandSoft)}
                onChange={(e) => commit({ brandSoft: hexToTriplet(e.target.value) })}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-transparent"
                aria-label="Secondary color"
              />
              <TextInput value={brandSoft} onChange={(e) => commit({ brandSoft: e.target.value })} className="flex-1" />
            </div>
          </Field>
          <button
            onClick={resetToPackBranding}
            className="text-xs font-medium text-zinc-500 underline decoration-dotted hover:text-zinc-900"
          >
            Reset to {attachedBrandProfile ? attachedBrandProfile.name : (pack?.label ?? "pack")} branding
          </button>
          <p className="text-[11px] text-zinc-400">
            These are per-profile overrides, layered on top of the attached brand profile (or pack branding when
            none is attached) — editing them here never changes the shared brand kit itself.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function PreviewTab({
  profile,
  pack,
  item,
}: {
  profile: DisplayProfile;
  pack: IndustryPack;
  item: InventoryItem;
}) {
  return (
    <Panel title="Live preview" bodyClassName="p-0">
      <div className="overflow-hidden rounded-b-2xl">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl">
          <DisplayProfileRenderer profile={profile} pack={pack} item={item} mode="preview" />
        </div>
      </div>
      <p className="p-4 text-center text-[11px] text-zinc-400">
        This is the exact widget composition the real Customer Display renders once this profile is Published —
        real listing data, no fabricated preview content.
      </p>
    </Panel>
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
      className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

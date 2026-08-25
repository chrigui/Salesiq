"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { ArrowLeft, ArrowUp, ArrowDown, Loader2, Eye, Upload, FileText, Trash2, RotateCcw, Check, Copy } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { Field, TextInput } from "@/components/console/builder/fields";
import { PACKS } from "@/core/industries";
import {
  useDisplayProfile,
  updateDisplayProfile,
  useDisplayProfileVersions,
  revertDisplayProfile,
  duplicateDisplayProfile,
  type DisplayProfile,
  type DisplayTemplate,
} from "@/core/store/displayProfiles";
import { WIDGET_LABELS } from "@/components/display/registry";
import { useBrandProfiles } from "@/core/store/brandProfiles";
import { DisplayProfileRenderer, type WidgetSpan } from "@/components/display/DisplayProfileRenderer";
import {
  MOTION_PRESET_IDS,
  MOTION_PRESET_LABELS,
  MOTION_PRESET_BLURBS,
  resolveMotionConfig,
  type MotionPresetId,
} from "@/core/display/motionPresets";
import type { IndustryPack, InventoryItem } from "@/core/types";

const TABS = ["Widgets", "Brand", "Motion", "History", "Preview"] as const;
export type Tab = (typeof TABS)[number];

const TEMPLATES: DisplayTemplate[] = [
  "Minimal",
  "NewDevelopment",
  "Detailed",
  "Lifestyle",
  "Investment",
  "LuxuryCinematic",
  "Cinematic",
  "Masterplan",
  "Custom",
  "Dashboard",
];

export function DisplayProfileEditor({
  id,
  onBack,
  initialTab,
  onDuplicated,
}: {
  id: string;
  onBack: () => void;
  initialTab?: Tab;
  /** Called with the new copy's id after a successful Duplicate — lets the caller jump straight into editing it. Omit to just return to the list. */
  onDuplicated?: (id: string) => void;
}) {
  const { profile, isLoading } = useDisplayProfile(id);
  const [tab, setTab] = useState<Tab>(initialTab ?? "Widgets");
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

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
              if (status === "Published") {
                setPublishDialogOpen(true);
                return;
              }
              updateDisplayProfile(id, { status });
            }}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
          <button
            disabled={duplicating}
            onClick={async () => {
              setDuplicating(true);
              const copy = await duplicateDisplayProfile(id);
              setDuplicating(false);
              if (copy) onDuplicated?.(copy.id);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {duplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />} Duplicate
          </button>
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
      {tab === "Motion" && <MotionTab id={id} profile={profile} />}
      {tab === "History" && <HistoryTab id={id} />}
      {tab === "Preview" && pack && item && <PreviewTab profile={profile} pack={pack} item={item} />}

      {publishDialogOpen && (
        <PublishDialog
          onClose={() => setPublishDialogOpen(false)}
          onPublish={(changeReason) => {
            updateDisplayProfile(id, { status: "Published", changeReason });
            setPublishDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function PublishDialog({ onClose, onPublish }: { onClose: () => void; onPublish: (changeReason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-zinc-900">Publish this profile</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Freezes the current draft as a new version — the real Customer Display picks it up on its next poll.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Change reason (optional)
          </span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Updated pricing and gallery"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50">
            Cancel
          </button>
          <button
            onClick={() => onPublish(reason.trim())}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryTab({ id }: { id: string }) {
  const { versions, isLoading } = useDisplayProfileVersions(id);
  const [reverting, setReverting] = useState<string | null>(null);

  return (
    <Panel title="Publish history">
      <p className="mb-3 text-xs text-zinc-400">
        Every published version, oldest to newest. Revert clones an old version into the draft and republishes it as
        a new version — history is never rewritten.
      </p>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : versions.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-400">Not published yet — publish once to start a history.</p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className={cx(
                "flex items-center gap-3 rounded-2xl border px-4 py-3",
                v.isCurrent ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white",
              )}
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-500">
                v{v.version}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-900">
                  {v.changeReason || "No change reason given"}
                </div>
                <div className="truncate text-xs text-zinc-400">
                  {v.authorName ?? "Unknown"} · {new Date(v.createdAt).toLocaleString()}
                </div>
              </div>
              {v.isCurrent ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  <Check className="h-3 w-3" /> Live
                </span>
              ) : (
                <button
                  disabled={reverting === v.id}
                  onClick={async () => {
                    setReverting(v.id);
                    await revertDisplayProfile(id, v.id);
                    setReverting(null);
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  {reverting === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Revert
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
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

  const setSpan = (idx: number, span: WidgetSpan) =>
    commit(sections.map((s, i) => (i === idx ? { ...s, config: { ...s.config, span } } : s)));

  const isGrid = profile.layout === "Grid";

  return (
    <div className="space-y-4">
      <AiDesignPanel id={id} />
      <Panel title="Layout">
        <div className="flex gap-2">
          {(["Stack", "Grid"] as const).map((l) => (
            <button
              key={l}
              onClick={() => updateDisplayProfile(id, { layout: l })}
              className={cx(
                "rounded-xl border px-3 py-2 text-sm font-medium transition",
                profile.layout === l
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
              )}
            >
              {l === "Stack" ? "Stack (scroll)" : "Grid (dashboard)"}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-zinc-400">
          Stack shows one full-width widget at a time as the customer scrolls. Grid shows every enabled
          widget at once as a dashboard of cards — set each widget&apos;s size below.
        </p>
      </Panel>
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
              {isGrid && (
                <select
                  value={(s.config?.span as WidgetSpan | undefined) ?? "lg"}
                  onChange={(e) => setSpan(i, e.target.value as WidgetSpan)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600"
                  aria-label={`${WIDGET_LABELS[s.type] ?? s.type} card size`}
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Full width</option>
                </select>
              )}
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
    </div>
  );
}

function AiDesignPanel({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<{
    sections: DisplayProfile["sections"];
    motion: DisplayProfile["motion"];
    rationale: string;
    engine: string;
  } | null>(null);
  const [applied, setApplied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setApplied(false);
    try {
      const res = await fetch("/api/ai/display-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: id }),
      });
      if (!res.ok) {
        setError("Couldn't generate a suggestion — try again.");
        return;
      }
      const data = await res.json();
      setProposal(data);
    } catch {
      setError("Couldn't reach the server — check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!proposal) return;
    updateDisplayProfile(id, { sections: proposal.sections, motion: proposal.motion });
    setApplied(true);
  };

  return (
    <Panel title="AI Design Assistant">
      <p className="text-xs text-zinc-400">
        Proposes a widget composition and motion style from this listing&rsquo;s real data — never invents facts,
        only decides structure. Nothing is saved until you apply it.
      </p>
      <button
        onClick={() => void generate()}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Thinking…" : proposal ? "Regenerate suggestion" : "Suggest a composition"}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {proposal && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-medium text-white">
              {proposal.motion.preset} motion
            </span>
            {Boolean(proposal.motion.reduceMotion) && (
              <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[10px] font-medium text-zinc-600">
                Reduce motion
              </span>
            )}
            <span className="ml-auto text-[10px] text-zinc-400">
              {proposal.engine === "claude+writer" ? "Authored by Claude" : "Deterministic writer — set ANTHROPIC_API_KEY for Claude-authored suggestions"}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-600">{proposal.rationale}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {proposal.sections
              .filter((s) => s.enabled)
              .map((s) => (
                <span key={s.id} className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-600">
                  {WIDGET_LABELS[s.type] ?? s.type}
                </span>
              ))}
          </div>
          <button
            onClick={apply}
            disabled={applied}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {applied ? <Check className="h-4 w-4" /> : null}
            {applied ? "Applied to draft" : "Apply to draft"}
          </button>
        </div>
      )}
    </Panel>
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

function MotionTab({ id, profile }: { id: string; profile: DisplayProfile }) {
  const config = resolveMotionConfig(profile.motion);
  const [reduceMotion, setReduceMotion] = useState(config.reduceMotion);
  useEffect(() => setReduceMotion(resolveMotionConfig(profile.motion).reduceMotion), [profile.id, profile.motion]);

  const applyPreset = (preset: MotionPresetId) => {
    updateDisplayProfile(id, { motion: { preset, reduceMotion } as DisplayProfile["motion"] });
  };

  const toggleReduceMotion = () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    updateDisplayProfile(id, { motion: { ...config, reduceMotion: next } as DisplayProfile["motion"] });
  };

  const setCustomField = (patch: Partial<typeof config>) => {
    const next = { ...config, ...patch, preset: "Custom" as const };
    updateDisplayProfile(id, { motion: next as DisplayProfile["motion"] });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Motion preset">
        <div className="grid gap-2 sm:grid-cols-2">
          {MOTION_PRESET_IDS.map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={cx(
                "rounded-xl border px-3 py-2.5 text-left transition",
                config.preset === p
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
              )}
            >
              <div className="text-sm font-semibold">{MOTION_PRESET_LABELS[p]}</div>
              <div className={cx("mt-0.5 text-[11px]", config.preset === p ? "text-white/70" : "text-zinc-400")}>
                {MOTION_PRESET_BLURBS[p]}
              </div>
            </button>
          ))}
        </div>

        <label className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={toggleReduceMotion}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm font-medium text-zinc-700">Reduce motion</span>
          <span className="ml-auto text-[11px] text-zinc-400">Collapses transitions to instant on the real Display</span>
        </label>
      </Panel>

      {config.preset === "Custom" && (
        <Panel title="Custom values">
          <div className="space-y-3">
            <Field label={`Transition duration — ${config.transition.durationMs}ms`}>
              <input
                type="range"
                min={100}
                max={1500}
                step={50}
                value={config.transition.durationMs}
                onChange={(e) =>
                  setCustomField({ transition: { ...config.transition, durationMs: Number(e.target.value) } })
                }
                className="w-full"
              />
            </Field>
            <Field label="Transition ease">
              <select
                value={config.transition.ease}
                onChange={(e) =>
                  setCustomField({
                    transition: { ...config.transition, ease: e.target.value as typeof config.transition.ease },
                  })
                }
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                <option value="linear">Linear</option>
                <option value="easeOut">Ease out</option>
                <option value="easeInOut">Ease in-out</option>
                <option value="circOut">Circ out</option>
                <option value="backOut">Back out</option>
              </select>
            </Field>
            <Field label={`Widget reveal stagger — ${config.reveal.staggerMs}ms`}>
              <input
                type="range"
                min={0}
                max={300}
                step={10}
                value={config.reveal.staggerMs}
                onChange={(e) => setCustomField({ reveal: { ...config.reveal, staggerMs: Number(e.target.value) } })}
                className="w-full"
              />
            </Field>
            <Field label={`Widget reveal distance — ${config.reveal.distancePx}px`}>
              <input
                type="range"
                min={0}
                max={80}
                step={4}
                value={config.reveal.distancePx}
                onChange={(e) => setCustomField({ reveal: { ...config.reveal, distancePx: Number(e.target.value) } })}
                className="w-full"
              />
            </Field>
            <Field label={`Hero image zoom — ${config.imageZoom.toFixed(2)}x`}>
              <input
                type="range"
                min={100}
                max={130}
                step={1}
                value={Math.round(config.imageZoom * 100)}
                onChange={(e) => setCustomField({ imageZoom: Number(e.target.value) / 100 })}
                className="w-full"
              />
            </Field>
          </div>
        </Panel>
      )}
    </div>
  );
}

const PREVIEW_FRAMES = [
  { id: "tv", label: "TV", widthClass: "max-w-4xl", aspectClass: "aspect-video" },
  { id: "desktop", label: "Desktop", widthClass: "max-w-3xl", aspectClass: "aspect-[16/10]" },
  { id: "tablet", label: "Tablet", widthClass: "max-w-sm", aspectClass: "aspect-[3/4]" },
  { id: "mobile", label: "Mobile", widthClass: "max-w-[280px]", aspectClass: "aspect-[9/19.5]" },
] as const;
type PreviewFrameId = (typeof PREVIEW_FRAMES)[number]["id"];

function PreviewTab({
  profile,
  pack,
  item,
}: {
  profile: DisplayProfile;
  pack: IndustryPack;
  item: InventoryItem;
}) {
  const [frameId, setFrameId] = useState<PreviewFrameId>("tv");
  const frame = PREVIEW_FRAMES.find((f) => f.id === frameId) ?? PREVIEW_FRAMES[0];

  return (
    <Panel title="Live preview" bodyClassName="p-0">
      <div className="flex justify-center gap-1 border-b border-zinc-100 p-3">
        {PREVIEW_FRAMES.map((f) => (
          <button
            key={f.id}
            onClick={() => setFrameId(f.id)}
            className={cx(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              frameId === f.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden bg-zinc-100 p-6">
        <div
          className={cx(
            "mx-auto overflow-y-auto rounded-2xl border border-zinc-800 shadow-2xl",
            frame.widthClass,
            frame.aspectClass,
          )}
        >
          <DisplayProfileRenderer profile={profile} pack={pack} item={item} mode="preview" />
        </div>
      </div>
      <p className="p-4 text-center text-[11px] text-zinc-400">
        This is the exact widget composition the real Customer Display renders once this profile is Published —
        real listing data, no fabricated preview content. Frame sizes are a layout guide, not a pixel-exact device
        emulation.
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

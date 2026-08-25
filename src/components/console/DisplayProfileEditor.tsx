"use client";

import { useEffect, useRef, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { ArrowLeft, GripVertical, Loader2, Eye, Upload, FileText, Trash2, RotateCcw, Check, Copy, Settings2 } from "lucide-react";
import { motion, useDragControls, type PanInfo } from "framer-motion";
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
import { WIDGET_LABELS, WIDGET_DESCRIPTIONS, WIDGET_CATEGORIES, WIDGET_CATEGORY } from "@/components/display/registry";
import { defaultDisplaySections, type DisplayTemplateId } from "@/lib/displayProfiles/sections";
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

/** Widget types with a per-widget settings drawer in the Widget order list — the extensible pattern; more types can be added here as they grow settings of their own. */
const WIDGETS_WITH_SETTINGS = new Set(["matchScore", "hero", "investment", "availability"]);

type WidgetVisibility = "always" | "whenRelevant" | "never";

function WidgetsTab({ id, profile }: { id: string; profile: DisplayProfile }) {
  const [sections, setSections] = useState(profile.sections);
  const [resetOpen, setResetOpen] = useState(false);
  const [settingsOpenId, setSettingsOpenId] = useState<string | null>(null);
  useEffect(() => setSections(profile.sections), [profile.sections]);

  const commit = (next: typeof sections) => {
    setSections(next);
    updateDisplayProfile(id, { sections: next });
  };

  const resetToTemplate = () => {
    commit(defaultDisplaySections(profile.template as DisplayTemplateId));
    setResetOpen(false);
  };

  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const registerRowRef = (id: string, el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  /**
   * Reorders by hit-testing the drop point's y against every other row's
   * current on-screen rect — same technique as the Companion's drag-to-
   * compare grid (DraggableCard/PropertyGrid), adapted to a single vertical
   * axis: find the first row whose vertical midpoint is below the drop
   * point and insert before it (or append, if the drop lands below every
   * row).
   */
  const reorder = (draggedId: string, dropY: number) => {
    const draggedIdx = sections.findIndex((s) => s.id === draggedId);
    if (draggedIdx === -1) return;
    let targetIdx = sections.length;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].id === draggedId) continue;
      const el = rowRefs.current.get(sections[i].id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (dropY < rect.top + rect.height / 2) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === draggedIdx || targetIdx === draggedIdx + 1) return;
    const next = [...sections];
    const [moved] = next.splice(draggedIdx, 1);
    next.splice(targetIdx > draggedIdx ? targetIdx - 1 : targetIdx, 0, moved);
    commit(next.map((s, i) => ({ ...s, order: i })));
  };

  const toggle = (idx: number) =>
    commit(sections.map((s, i) => (i === idx ? { ...s, enabled: !s.enabled } : s)));

  /** The Widget Library groups by category (not array order), so it addresses a widget by type rather than index — every template seeds exactly one section per type, so this is unambiguous. */
  const toggleByType = (type: string) =>
    commit(sections.map((s) => (s.type === type ? { ...s, enabled: !s.enabled } : s)));

  const setSpan = (idx: number, span: WidgetSpan) =>
    commit(sections.map((s, i) => (i === idx ? { ...s, config: { ...s.config, span } } : s)));

  const setConfig = (idx: number, patch: Record<string, unknown>) =>
    commit(sections.map((s, i) => (i === idx ? { ...s, config: { ...s.config, ...patch } } : s)));

  const setVisibility = (idx: number, visibility: WidgetVisibility) => setConfig(idx, { visibility });

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
      <WidgetLibraryPanel sections={sections} onToggle={toggleByType} />
      <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Widget order">
        <p className="mb-2 text-[11px] text-zinc-400">Drag a row by its handle to reorder.</p>
        <div className="space-y-2">
          {sections.map((s, i) => (
            <DraggableWidgetRow key={s.id} registerRef={(el) => registerRowRef(s.id, el)} onDragEnd={(y) => reorder(s.id, y)}>
              <div
                className={cx(
                  "rounded-2xl border",
                  s.enabled ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50",
                )}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
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
                  {WIDGETS_WITH_SETTINGS.has(s.type) && (
                    <button
                      onClick={() => setSettingsOpenId(settingsOpenId === s.id ? null : s.id)}
                      aria-label={`${WIDGET_LABELS[s.type] ?? s.type} settings`}
                      className={cx(
                        "rounded-lg p-1.5 transition",
                        settingsOpenId === s.id ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600",
                      )}
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <select
                    value={(s.config?.visibility as WidgetVisibility | undefined) ?? "always"}
                    onChange={(e) => setVisibility(i, e.target.value as WidgetVisibility)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600"
                    aria-label={`${WIDGET_LABELS[s.type] ?? s.type} visibility`}
                  >
                    <option value="always">Always</option>
                    <option value="whenRelevant">When relevant</option>
                    <option value="never">Never</option>
                  </select>
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
                </div>
                {settingsOpenId === s.id && (
                  <WidgetSettingsDrawer type={s.type} config={s.config} onChange={(patch) => setConfig(i, patch)} />
                )}
              </div>
            </DraggableWidgetRow>
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
        <button
          onClick={() => setResetOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset widgets to &ldquo;{profile.template}&rdquo; defaults
        </button>
      </Panel>

      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setResetOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-zinc-900">Reset widgets to template defaults?</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Replaces the widget composition above with &ldquo;{profile.template}&rdquo;&rsquo;s starting layout —
              which widgets are enabled and their order. Brand, motion, and idle settings are untouched.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setResetOpen(false)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={resetToTemplate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <DocumentsPanel profileId={id} />
      </div>
    </div>
  );
}

/**
 * Per-widget settings drawer, shown under a widget's row in the Widget order
 * list when it's expanded. Only wired for the 4 widget types in
 * WIDGETS_WITH_SETTINGS today — this switch is the extensible pattern for
 * adding more widget types' settings later, not a generic settings engine.
 */
function WidgetSettingsDrawer({
  type,
  config,
  onChange,
}: {
  type: string;
  config: Record<string, unknown> | undefined;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3 border-t border-zinc-100 px-3 py-3">
      {type === "matchScore" && (
        <>
          <Field label="Display style">
            <select
              value={(config?.displayStyle as string | undefined) ?? "Ring"}
              onChange={(e) => onChange({ displayStyle: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700"
            >
              <option value="Ring">Ring</option>
              <option value="Bar">Bar</option>
              <option value="Number">Number</option>
              <option value="Minimal">Minimal</option>
            </select>
          </Field>
          <SettingsCheckbox
            label="Show reason text"
            checked={config?.showReasons !== false}
            onChange={(v) => onChange({ showReasons: v })}
          />
        </>
      )}
      {type === "hero" && (
        <>
          <SettingsCheckbox label="Show price" checked={config?.showPrice !== false} onChange={(v) => onChange({ showPrice: v })} />
          <SettingsCheckbox
            label="Show bedrooms"
            checked={config?.showBedrooms === true}
            onChange={(v) => onChange({ showBedrooms: v })}
          />
          <SettingsCheckbox
            label="Show location"
            checked={config?.showLocation === true}
            onChange={(v) => onChange({ showLocation: v })}
          />
        </>
      )}
      {type === "investment" && (
        <>
          <SettingsCheckbox label="Show ROI" checked={config?.showRoi !== false} onChange={(v) => onChange({ showRoi: v })} />
          <SettingsCheckbox
            label="Show rental yield"
            checked={config?.showRentalYield !== false}
            onChange={(v) => onChange({ showRentalYield: v })}
          />
        </>
      )}
      {type === "availability" && (
        <SettingsCheckbox
          label="Show numeric progress bar"
          checked={config?.showNumericBar !== false}
          onChange={(v) => onChange({ showNumericBar: v })}
        />
      )}
    </div>
  );
}

function SettingsCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-zinc-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-zinc-300"
      />
      {label}
    </label>
  );
}

/**
 * The browsable widget catalog — every widget a template could ever seed,
 * grouped by category with a name/description/Add-Added state. This is a
 * different view onto the exact same `sections` array the ordered list
 * below edits (there's no separate "add a widget" mechanism — every widget
 * type already has a slot from creation, per defaultDisplaySections()), so
 * toggling a card here and toggling the same widget's checkbox below always
 * agree.
 */
function WidgetLibraryPanel({
  sections,
  onToggle,
}: {
  sections: DisplayProfile["sections"];
  onToggle: (type: string) => void;
}) {
  const byType = new Map(sections.map((s) => [s.type, s]));
  return (
    <Panel title="Widget library">
      <p className="mb-3 text-xs text-zinc-400">
        Every widget the Customer Display can show, grouped by category. Add one to enable it — where it appears is
        set below in Widget order.
      </p>
      <div className="space-y-4">
        {WIDGET_CATEGORIES.map((category) => {
          const types = Object.keys(WIDGET_CATEGORY).filter((t) => WIDGET_CATEGORY[t] === category && byType.has(t));
          if (types.length === 0) return null;
          return (
            <div key={category}>
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {category}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {types.map((type) => {
                  const section = byType.get(type)!;
                  return (
                    <div
                      key={type}
                      className={cx(
                        "flex flex-col gap-2 rounded-2xl border p-3",
                        section.enabled ? "border-emerald-200 bg-emerald-50/40" : "border-zinc-200 bg-white",
                      )}
                    >
                      <div className="text-sm font-medium text-zinc-900">{WIDGET_LABELS[type] ?? type}</div>
                      <p className="flex-1 text-xs text-zinc-400">{WIDGET_DESCRIPTIONS[type] ?? ""}</p>
                      <button
                        onClick={() => onToggle(type)}
                        aria-label={`${section.enabled ? "Remove" : "Add"} ${WIDGET_LABELS[type] ?? type}`}
                        className={cx(
                          "inline-flex items-center justify-center gap-1.5 self-start rounded-lg px-2.5 py-1 text-xs font-medium transition",
                          section.enabled
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                        )}
                      >
                        {section.enabled ? (
                          <>
                            <Check className="h-3 w-3" /> Added
                          </>
                        ) : (
                          "Add"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
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

/**
 * A vertical-reorder row using the same real drag gesture (framer-motion's
 * native `drag`, no new library) and drop-point hit-testing technique as
 * the Companion's drag-to-compare grid (DraggableCard/PropertyGrid) —
 * adapted from free 2D drag onto a compare target to axis-locked vertical
 * drag with the drop point tested against sibling rows' midpoints. Drag
 * only starts from the grip handle (`dragListener={false}` + manual
 * `dragControls.start()`), so the checkbox and size `<select>` inside stay
 * normal interactive elements instead of accidentally triggering a drag.
 */
function DraggableWidgetRow({
  registerRef,
  onDragEnd,
  children,
}: {
  registerRef: (el: HTMLDivElement | null) => void;
  onDragEnd: (dropY: number) => void;
  children: React.ReactNode;
}) {
  const controls = useDragControls();

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    onDragEnd(info.point.y - window.scrollY);
  };

  return (
    <motion.div
      ref={registerRef}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragMomentum={false}
      dragElastic={0.08}
      dragSnapToOrigin
      whileDrag={{ scale: 1.02, zIndex: 20, boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}
      onDragEnd={handleDragEnd}
      className="flex items-center gap-1 touch-none"
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        aria-label="Drag to reorder"
        className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-300 transition hover:text-zinc-500 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </motion.div>
  );
}

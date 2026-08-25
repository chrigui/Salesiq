"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { MonitorPlay, Plus, Loader2, Eye, EyeOff, FileEdit, Radio, Copy, Check } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { PACKS } from "@/core/industries";
import {
  createDisplayProfile,
  useDisplayProfiles,
  type DisplayProfile,
  type DisplayProfileStatus,
  type DisplayTemplate,
} from "@/core/store/displayProfiles";
import { createDisplay, updateDisplay, useDisplays, type Display } from "@/core/store/displays";
import {
  createBrandProfile,
  deleteBrandProfile,
  updateBrandProfile,
  useBrandProfiles,
  type BrandProfile,
} from "@/core/store/brandProfiles";
import { DisplayProfileEditor } from "@/components/console/DisplayProfileEditor";
import { Field, TextInput, Select } from "@/components/console/builder/fields";
import { Palette, Trash2, Upload, X as XIcon } from "lucide-react";
import { FONT_OPTIONS } from "@/core/display/brandFonts";
import { MOTION_PRESET_IDS, MOTION_PRESET_LABELS, MOTION_PRESET_BLURBS, type MotionPresetId } from "@/core/display/motionPresets";

/**
 * BrandProfile.defaultMotionPreset stores a bare preset id string — unlike
 * DisplayProfile.motion (a full Json blob), it has no schema support for
 * per-value Custom overrides, so "Custom" is excluded here: picking it would
 * silently resolve to the same values as Cinematic (resolveMotionConfig's
 * Custom branch has nothing stored to override), which would only confuse
 * an admin picking a kit-wide default.
 */
const BRAND_MOTION_PRESET_IDS = MOTION_PRESET_IDS.filter((p): p is Exclude<MotionPresetId, "Custom"> => p !== "Custom");

const STATUS_STYLE: Record<DisplayProfileStatus, string> = {
  Draft: "bg-zinc-200 text-zinc-500",
  Published: "bg-emerald-100 text-emerald-700",
  Archived: "bg-amber-100 text-amber-700",
};

const TEMPLATES: { id: DisplayTemplate; label: string; blurb: string }[] = [
  { id: "Minimal", label: "Minimal", blurb: "Large imagery, restrained UI — for premium/luxury projects" },
  { id: "NewDevelopment", label: "New Development", blurb: "Project hero, vision, masterplan, phases" },
  { id: "Detailed", label: "Detailed", blurb: "Specs, floor plan, gallery, payment plan" },
  { id: "Lifestyle", label: "Lifestyle", blurb: "The experience of living in the development" },
  { id: "Investment", label: "Investment", blurb: "Payment structure, rental & appreciation info" },
  { id: "LuxuryCinematic", label: "Luxury / Cinematic", blurb: "Immersive, image-led, elegant reveals" },
  { id: "Masterplan", label: "Masterplan / Community", blurb: "Districts, buildings, amenities, infrastructure" },
  { id: "Custom", label: "Custom", blurb: "Start blank and build with the widget library" },
  { id: "Dashboard", label: "Dashboard", blurb: "A grid of live widget cards, always visible at once" },
];

export function DisplayStudio() {
  const [tab, setTab] = useState<"profiles" | "displays" | "brand">("profiles");
  const { profiles, isLoading } = useDisplayProfiles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (selectedId) {
    return <DisplayProfileEditor id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 text-xs font-medium">
        {(["profiles", "displays", "brand"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "rounded-lg px-3 py-1.5 transition",
              tab === t ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50",
            )}
          >
            {t === "profiles" ? "Profiles" : t === "displays" ? "Displays" : "Brand"}
          </button>
        ))}
      </div>

      {tab === "displays" ? (
        <DisplaysPanel profiles={profiles} />
      ) : tab === "brand" ? (
        <BrandProfilesPanel />
      ) : (
        <Panel
          title="Display Studio"
          right={
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" /> New display profile
            </button>
          }
        >
          <p className="mb-3 text-xs text-zinc-400">
            Configure the cinematic, customer-facing experience the Customer Display shows for a specific listing —
            template, brand, and widgets, previewed and published independently of the live sales session.
          </p>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : profiles.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">
              No display profiles yet. Create one for a listing to shape what the Customer Display shows.
            </p>
          ) : (
            <div className="space-y-2">
              {profiles.map((p) => (
                <ProfileRow key={p.id} profile={p} onOpen={() => setSelectedId(p.id)} />
              ))}
            </div>
          )}
        </Panel>
      )}

      {pickerOpen && (
        <NewProfilePicker
          onClose={() => setPickerOpen(false)}
          onCreated={(id) => {
            setPickerOpen(false);
            setSelectedId(id);
          }}
        />
      )}
    </div>
  );
}

function DisplaysPanel({ profiles }: { profiles: DisplayProfile[] }) {
  const { displays, isLoading } = useDisplays();
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<Display | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <>
      <Panel
        title="Displays"
        right={
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" /> Add display
          </button>
        }
      >
        <p className="mb-3 text-xs text-zinc-400">
          Physical screens registered to this tenant — each can be assigned its own idle experience, independent of
          the live sales session it may be paired to via the Companion.
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : displays.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            No displays registered yet. Add one to get a pairing code for a physical screen.
          </p>
        ) : (
          <div className="space-y-2">
            {displays.map((d) => (
              <DisplayRow
                key={d.id}
                display={d}
                profiles={profiles}
                expanded={expandedId === d.id}
                onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
              />
            ))}
          </div>
        )}
      </Panel>

      {creating && (
        <NewDisplayDialog
          onClose={() => setCreating(false)}
          onCreated={(display) => {
            setCreating(false);
            setJustCreated(display);
          }}
        />
      )}
      {justCreated && <PairingCodeDialog display={justCreated} onClose={() => setJustCreated(null)} />}
    </>
  );
}

function DisplayRow({
  display,
  profiles,
  expanded,
  onToggle,
}: {
  display: Display;
  profiles: DisplayProfile[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const [showCode, setShowCode] = useState(false);
  const idleProfile = profiles.find((p) => p.id === display.idleProfileId);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-500">
          <Radio className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-zinc-900">{display.name}</div>
          <div className="truncate text-xs text-zinc-400">
            {!display.claimed
              ? "Not yet paired"
              : idleProfile
                ? `Idle: ${idleProfile.name}`
                : "No idle experience assigned"}
          </div>
        </div>
        <span
          className={cx(
            "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
            display.online
              ? "bg-emerald-100 text-emerald-700"
              : display.claimed
                ? "bg-zinc-200 text-zinc-500"
                : "bg-amber-100 text-amber-700",
          )}
        >
          <span className={cx("h-1.5 w-1.5 rounded-full", display.online ? "bg-emerald-500" : "bg-zinc-400")} />
          {display.online ? "Online" : display.claimed ? "Offline" : "Pending"}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-zinc-100 px-4 py-3">
          <div className="text-xs text-zinc-400">
            {display.lastSeenAt
              ? `Last seen ${new Date(display.lastSeenAt).toLocaleString()}`
              : "Never checked in yet."}
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Idle experience
            </span>
            <select
              value={display.idleProfileId ?? ""}
              onChange={(e) => updateDisplay(display.id, { idleProfileId: e.target.value || null })}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="">None — default idle carousel</option>
              {profiles
                .filter((p) => p.status === "Published")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            {profiles.some((p) => p.status !== "Published") && (
              <span className="mt-1 block text-[11px] text-zinc-400">
                Only Published profiles can be assigned — publish a draft first to see it here.
              </span>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCode(true)}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-50"
            >
              Show pairing code
            </button>
            {display.status !== "Archived" && (
              <button
                onClick={() => updateDisplay(display.id, { status: "Archived" })}
                className="rounded-xl border border-red-200 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-50"
              >
                Archive
              </button>
            )}
          </div>
        </div>
      )}

      {showCode && <PairingCodeDialog display={display} onClose={() => setShowCode(false)} />}
    </div>
  );
}

function NewDisplayDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (display: Display) => void }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-zinc-900">Add display</h3>
        <p className="mt-1 text-xs text-zinc-400">Name it for where it&rsquo;ll sit — e.g. &ldquo;Sales Center — Main Display&rdquo;.</p>

        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sales Center — Main Display"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50">
            Cancel
          </button>
          <button
            disabled={!name.trim() || submitting}
            onClick={async () => {
              setSubmitting(true);
              const display = await createDisplay({ name: name.trim() });
              setSubmitting(false);
              if (display) onCreated(display);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

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

function BrandProfilesPanel() {
  const { brandProfiles, isLoading } = useBrandProfiles();
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <>
      <Panel
        title="Brand Profiles"
        right={
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" /> New brand profile
          </button>
        }
      >
        <p className="mb-3 text-xs text-zinc-400">
          Reusable brand kits — build once (&ldquo;Green Hills Luxury&rdquo;), attach to as many display profiles as you like.
          Editing a brand profile updates every profile it&apos;s attached to.
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : brandProfiles.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            No brand profiles yet. Create one to reuse a consistent look across multiple display profiles.
          </p>
        ) : (
          <div className="space-y-2">
            {brandProfiles.map((bp) => (
              <BrandProfileRow
                key={bp.id}
                brandProfile={bp}
                expanded={expandedId === bp.id}
                onToggle={() => setExpandedId(expandedId === bp.id ? null : bp.id)}
              />
            ))}
          </div>
        )}
      </Panel>

      {creating && <NewBrandProfileDialog onClose={() => setCreating(false)} />}
    </>
  );
}

const MAX_LOGO_BYTES = 8 * 1024 * 1024;
const ALLOWED_LOGO_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

function BrandProfileRow({
  brandProfile,
  expanded,
  onToggle,
}: {
  brandProfile: BrandProfile;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [brand, setBrand] = useState(brandProfile.brand ?? "16 185 129");
  const [brandSoft, setBrandSoft] = useState(brandProfile.brandSoft ?? "52 211 153");
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  useEffect(() => {
    setBrand(brandProfile.brand ?? "16 185 129");
    setBrandSoft(brandProfile.brandSoft ?? "52 211 153");
  }, [brandProfile.id, brandProfile.brand, brandProfile.brandSoft]);

  const uploadLogo = async (file: File) => {
    setLogoError(null);
    if (!ALLOWED_LOGO_MIME.has(file.type)) {
      setLogoError("PNG, JPEG, or WEBP only.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Logo must be under 8MB.");
      return;
    }
    setLogoUploading(true);
    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    await updateBrandProfile(brandProfile.id, { logoDataBase64: base64, logoMimeType: file.type });
    setLogoUploading(false);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"
          style={{ background: `rgb(${brandProfile.brand ?? "16 185 129"})` }}
        >
          <Palette className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-sm font-medium text-zinc-900">{brandProfile.name}</div>
            {brandProfile.isDefault && (
              <span className="shrink-0 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Default
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-zinc-100 px-4 py-3">
          <Field label="Primary color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={tripletToHex(brand)}
                onChange={(e) => {
                  const next = hexToTriplet(e.target.value);
                  setBrand(next);
                  updateBrandProfile(brandProfile.id, { brand: next });
                }}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-transparent"
                aria-label="Primary color"
              />
              <TextInput
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  updateBrandProfile(brandProfile.id, { brand: e.target.value });
                }}
                className="flex-1"
              />
            </div>
          </Field>
          <Field label="Secondary / accent color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={tripletToHex(brandSoft)}
                onChange={(e) => {
                  const next = hexToTriplet(e.target.value);
                  setBrandSoft(next);
                  updateBrandProfile(brandProfile.id, { brandSoft: next });
                }}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-transparent"
                aria-label="Secondary color"
              />
              <TextInput
                value={brandSoft}
                onChange={(e) => {
                  setBrandSoft(e.target.value);
                  updateBrandProfile(brandProfile.id, { brandSoft: e.target.value });
                }}
                className="flex-1"
              />
            </div>
          </Field>

          <Field label="Logo" hint="PNG, JPEG, or WEBP, up to 8MB — replaces the emoji/text glyph wherever this brand renders">
            <div className="flex items-center gap-3">
              {brandProfile.logoMimeType ? (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/brand-profiles/${brandProfile.id}/logo?v=${brandProfile.updatedAt}`}
                    alt="Brand logo"
                    className="h-10 w-10 rounded-lg border border-zinc-200 object-contain"
                  />
                  <button
                    onClick={() => updateBrandProfile(brandProfile.id, { removeLogo: true })}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600 transition hover:bg-zinc-50"
                  >
                    <XIcon className="h-3 w-3" /> Remove
                  </button>
                </div>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50">
                  <Upload className="h-3.5 w-3.5" />
                  {logoUploading ? "Uploading…" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={logoUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadLogo(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            {logoError && <p className="mt-1 text-[11px] text-red-600">{logoError}</p>}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Heading font">
              <Select
                value={brandProfile.fontHeading ?? ""}
                onChange={(e) => updateBrandProfile(brandProfile.id, { fontHeading: e.target.value || null })}
              >
                <option value="">Default</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Body font">
              <Select
                value={brandProfile.fontBody ?? ""}
                onChange={(e) => updateBrandProfile(brandProfile.id, { fontBody: e.target.value || null })}
              >
                <option value="">Default</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Not a <Field> here (unlike the other fields on this row): Field
              wraps its children in a <label>, and <button> is a labelable
              HTML element — with several buttons inside one <label>, each
              one's accessible name would absorb the whole label's text plus
              every sibling button's text, making them indistinguishable to
              assistive tech (and to role-based test queries). */}
          <div className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Motion preset
            </span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <button
                onClick={() => updateBrandProfile(brandProfile.id, { defaultMotionPreset: null })}
                className={cx(
                  "rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition",
                  !brandProfile.defaultMotionPreset
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                )}
              >
                Default
              </button>
              {BRAND_MOTION_PRESET_IDS.map((p) => (
                <button
                  key={p}
                  onClick={() => updateBrandProfile(brandProfile.id, { defaultMotionPreset: p })}
                  title={MOTION_PRESET_BLURBS[p]}
                  className={cx(
                    "rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition",
                    brandProfile.defaultMotionPreset === p
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                  )}
                >
                  {MOTION_PRESET_LABELS[p]}
                </button>
              ))}
            </div>
            <span className="mt-1 block text-[11px] text-zinc-400">
              Applied wherever this kit is the tenant&rsquo;s default — the timing/easing of the hardcoded Display&rsquo;s scene transitions
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => updateBrandProfile(brandProfile.id, { setDefault: !brandProfile.isDefault })}
              title={
                brandProfile.isDefault
                  ? "Stop theming the whole Customer Display with this kit"
                  : "Theme the whole Customer Display (Welcome, Matches, Recap, etc.) with this kit — not just profiles it's attached to"
              }
              className={cx(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                brandProfile.isDefault
                  ? "border-zinc-900 bg-zinc-900 text-white hover:brightness-110"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
              )}
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              {brandProfile.isDefault ? "Default for whole Display" : "Set as default"}
            </button>
            <button
              onClick={() => deleteBrandProfile(brandProfile.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete brand profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewBrandProfileDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-zinc-900">New brand profile</h3>
        <p className="mt-1 text-xs text-zinc-400">Name it after the brand it represents — colors are editable after creating it.</p>

        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Green Hills Luxury"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50">
            Cancel
          </button>
          <button
            disabled={!name.trim() || submitting}
            onClick={async () => {
              setSubmitting(true);
              await createBrandProfile({ name: name.trim() });
              setSubmitting(false);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function PairingCodeDialog({ display, onClose }: { display: Display; onClose: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/display?pair=${display.pairingCode}` : "";

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#0a0f1c", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-zinc-900">Pair &ldquo;{display.name}&rdquo;</h3>
        <p className="mt-1 text-xs text-zinc-400">Scan on the physical screen, or type the code at /display.</p>

        <div className="mt-4 flex flex-col items-center gap-3">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Pairing QR code" width={200} height={200} className="rounded-xl" />
          ) : (
            <div className="h-[200px] w-[200px] animate-pulse rounded-xl bg-zinc-100" />
          )}
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2">
            <span className="font-mono text-lg font-semibold tracking-[0.3em] text-zinc-900">{display.pairingCode}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(display.pairingCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-zinc-400 hover:text-zinc-600"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function ProfileRow({ profile, onOpen }: { profile: DisplayProfile; onOpen: () => void }) {
  const pack = PACKS.find((p) => p.id === profile.packId);
  const item = pack?.inventory.find((i) => i.id === profile.itemId);

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-zinc-300"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-500">
        <MonitorPlay className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-zinc-900">{profile.name}</div>
        <div className="truncate text-xs text-zinc-400">
          {item?.name ?? "Listing removed"} · {pack?.label ?? profile.packId} · {profile.template}
        </div>
      </div>
      <span className={cx("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium", STATUS_STYLE[profile.status])}>
        {profile.status}
      </span>
      {profile.status === "Published" ? (
        <Eye className="h-4 w-4 shrink-0 text-zinc-300" />
      ) : (
        <EyeOff className="h-4 w-4 shrink-0 text-zinc-300" />
      )}
      <FileEdit className="h-4 w-4 shrink-0 text-zinc-300" />
    </button>
  );
}

function NewProfilePicker({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [packId, setPackId] = useState(PACKS[0]?.id ?? "");
  const pack = PACKS.find((p) => p.id === packId) ?? PACKS[0];
  const [itemId, setItemId] = useState(pack?.inventory[0]?.id ?? "");
  const [template, setTemplate] = useState<DisplayTemplate>("Minimal");
  const [submitting, setSubmitting] = useState(false);

  const items = pack?.inventory ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-zinc-900">New display profile</h3>
        <p className="mt-1 text-xs text-zinc-400">Pick a listing and a starting template — every template is fully editable afterward.</p>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">Pack</span>
              <select
                value={packId}
                onChange={(e) => {
                  setPackId(e.target.value);
                  const next = PACKS.find((p) => p.id === e.target.value);
                  setItemId(next?.inventory[0]?.id ?? "");
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                {PACKS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">Listing</span>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">Template</span>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cx(
                    "rounded-xl border px-3 py-2 text-left text-xs transition",
                    template === t.id
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                  )}
                >
                  <div className="font-semibold">{t.label}</div>
                  <div className={cx("mt-0.5", template === t.id ? "text-white/70" : "text-zinc-400")}>{t.blurb}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            disabled={!packId || !itemId || submitting}
            onClick={async () => {
              setSubmitting(true);
              const profile = await createDisplayProfile({ packId, itemId, template });
              setSubmitting(false);
              if (profile) onCreated(profile.id);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

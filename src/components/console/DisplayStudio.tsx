"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { MonitorPlay, Plus, Loader2, Eye, EyeOff, FileEdit, Radio, Copy, Check, RotateCcw, Rocket, Sparkles } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { PACKS } from "@/core/industries";
import {
  createDisplayProfile,
  updateDisplayProfile,
  revertDisplayProfile,
  duplicateDisplayProfile,
  useDisplayProfiles,
  useDisplayProfileVersions,
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
import { DisplayProfileEditor, PublishDialog, type Tab as EditorTab } from "@/components/console/DisplayProfileEditor";
import { validateDisplayProfileForPublish } from "@/lib/displayProfiles/validation";
import { Field, TextInput, Select } from "@/components/console/builder/fields";
import { Palette, Trash2, Upload, X as XIcon } from "lucide-react";
import { FONT_OPTIONS, fontStack } from "@/core/display/brandFonts";
import { MOTION_PRESET_IDS, MOTION_PRESET_LABELS, MOTION_PRESET_BLURBS, type MotionPresetId } from "@/core/display/motionPresets";
import { resolveBrandTokens } from "@/core/display/brandTokens";

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

const CARD_STYLE_OPTIONS: { id: string; label: string }[] = [
  { id: "Glass", label: "Glass — frosted, translucent" },
  { id: "Solid", label: "Solid — flat opaque surface" },
  { id: "Outlined", label: "Outlined — border only, no fill" },
];
const BUTTON_STYLE_OPTIONS: { id: string; label: string }[] = [
  { id: "Filled", label: "Filled" },
  { id: "Outline", label: "Outline" },
  { id: "Ghost", label: "Ghost" },
];
const BORDER_RADIUS_OPTIONS: { id: string; label: string }[] = [
  { id: "Sharp", label: "Sharp" },
  { id: "Soft", label: "Soft" },
  { id: "Round", label: "Round" },
];
const SHADOW_INTENSITY_OPTIONS: { id: string; label: string }[] = [
  { id: "Flat", label: "Flat" },
  { id: "Subtle", label: "Subtle" },
  { id: "Elevated", label: "Elevated" },
];
const SPACING_SCALE_OPTIONS: { id: string; label: string }[] = [
  { id: "Compact", label: "Compact" },
  { id: "Comfortable", label: "Comfortable" },
  { id: "Spacious", label: "Spacious" },
];
const HEADING_WEIGHT_OPTIONS: { id: string; label: string }[] = [
  { id: "Regular", label: "Regular" },
  { id: "Medium", label: "Medium" },
  { id: "Semibold", label: "Semibold" },
  { id: "Bold", label: "Bold" },
];
const LETTER_SPACING_OPTIONS: { id: string; label: string }[] = [
  { id: "Tight", label: "Tight" },
  { id: "Normal", label: "Normal" },
  { id: "Wide", label: "Wide" },
];

const TEMPLATES: { id: DisplayTemplate; label: string; blurb: string }[] = [
  { id: "Minimal", label: "Minimal", blurb: "Large imagery, restrained UI — for premium/luxury projects" },
  { id: "NewDevelopment", label: "New Development", blurb: "Project hero, vision, masterplan, phases" },
  { id: "Detailed", label: "Detailed", blurb: "Specs, floor plan, gallery, payment plan" },
  { id: "Lifestyle", label: "Lifestyle", blurb: "The experience of living in the development" },
  { id: "Investment", label: "Investment", blurb: "Payment structure, rental & appreciation info" },
  { id: "LuxuryCinematic", label: "Luxury", blurb: "Elegant, restrained luxury presentation with cinematic reveals" },
  { id: "Cinematic", label: "Cinematic", blurb: "The leanest, most image-led template — hero and gallery carry the moment" },
  { id: "Masterplan", label: "Masterplan / Community", blurb: "Districts, buildings, amenities, infrastructure" },
  { id: "Custom", label: "Custom", blurb: "Start blank and build with the widget library" },
  { id: "Dashboard", label: "Dashboard", blurb: "A grid of live widget cards, always visible at once" },
];

export function DisplayStudio() {
  const [tab, setTab] = useState<"profiles" | "displays" | "brand">("profiles");
  const { profiles, isLoading } = useDisplayProfiles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<EditorTab | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  const openProfile = (id: string, initialTab?: EditorTab) => {
    setSelectedId(id);
    setSelectedTab(initialTab);
  };

  if (selectedId) {
    return (
      <DisplayProfileEditor
        id={selectedId}
        initialTab={selectedTab}
        onBack={() => setSelectedId(null)}
        onDuplicated={(newId) => openProfile(newId)}
      />
    );
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
            <div className="space-y-4">
              <CurrentProfileCard profile={profiles[0]} onOpen={openProfile} />
              {profiles.length > 1 && (
                <div>
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Other profiles
                  </span>
                  <div className="space-y-2">
                    {profiles.slice(1).map((p) => (
                      <ProfileRow key={p.id} profile={p} onOpen={() => openProfile(p.id)} />
                    ))}
                  </div>
                </div>
              )}
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

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Live profile
            </span>
            <select
              value={display.liveProfileId ?? ""}
              onChange={(e) => updateDisplay(display.id, { liveProfileId: e.target.value || null })}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="">None — driven by the Companion session</option>
              {profiles
                .filter((p) => p.status === "Published")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <span className="mt-1 block text-[11px] text-zinc-400">
              Pins this screen to one listing continuously — e.g. an Investment Center showroom — regardless of what
              the Companion focuses. Leave unset for normal Companion-driven behavior.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Default experience
            </span>
            <select
              value={display.defaultExperience}
              onChange={(e) =>
                updateDisplay(display.id, { defaultExperience: e.target.value as Display["defaultExperience"] })
              }
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="Welcome">Welcome — the default splash</option>
              <option value="PropertyHero">Property hero — opens on the top recommendation</option>
              <option value="CustomIntro">Custom intro — opens on the idle profile&apos;s listing</option>
            </select>
            <span className="mt-1 block text-[11px] text-zinc-400">
              What a brand new Companion session opens this screen on. Only applies when no live profile is pinned
              above.
            </span>
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

/**
 * WCAG relative-luminance contrast ratio between two "R G B" triplets — the
 * color-system guardrail the spec asks for ("must not allow accidentally
 * unreadable combinations"), kept to the one check that actually matters
 * here (text vs. its background) rather than a full accessibility engine.
 */
function relativeLuminance(triplet: string): number {
  const [r, g, b] = triplet.trim().split(/\s+/).map((n) => (Number(n) || 0) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}
const LOW_CONTRAST_THRESHOLD = 3;

/** Default fallbacks — must mirror the hardcoded values BrandTokenScope/globals.css/tailwind.config.ts fall back to when a kit leaves a color unset, so the preview and warnings reflect what the Display actually renders. */
const FALLBACK = {
  background: "9 9 11",
  text: "244 244 245",
  muted: "161 161 170",
  surface: "24 24 27",
  success: "52 211 153",
  warning: "251 191 36",
  danger: "248 113 113",
  brand: "16 185 129",
  brandSoft: "52 211 153",
};

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

/** A nullable-color field — clearing the text input reverts to the platform default rather than storing black. */
function ColorField({
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string | null;
  fallback: string;
  onChange: (next: string | null) => void;
}) {
  const triplet = value || fallback;
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={tripletToHex(triplet)}
          onChange={(e) => onChange(hexToTriplet(e.target.value))}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-transparent"
          aria-label={label}
        />
        <TextInput
          value={value ?? ""}
          placeholder={fallback}
          onChange={(e) => onChange(e.target.value || null)}
          className="flex-1"
        />
      </div>
    </Field>
  );
}

type BrandDraft = Pick<
  BrandProfile,
  | "brand"
  | "brandSoft"
  | "backgroundColor"
  | "textColor"
  | "mutedTextColor"
  | "surfaceColor"
  | "successColor"
  | "warningColor"
  | "dangerColor"
  | "cardStyle"
  | "buttonStyle"
  | "borderRadius"
  | "shadowIntensity"
  | "spacingScale"
  | "headingWeight"
  | "letterSpacing"
  | "fontHeading"
  | "fontBody"
>;

function draftFromBrandProfile(bp: BrandProfile): BrandDraft {
  return {
    brand: bp.brand,
    brandSoft: bp.brandSoft,
    backgroundColor: bp.backgroundColor,
    textColor: bp.textColor,
    mutedTextColor: bp.mutedTextColor,
    surfaceColor: bp.surfaceColor,
    successColor: bp.successColor,
    warningColor: bp.warningColor,
    dangerColor: bp.dangerColor,
    cardStyle: bp.cardStyle,
    buttonStyle: bp.buttonStyle,
    borderRadius: bp.borderRadius,
    shadowIntensity: bp.shadowIntensity,
    spacingScale: bp.spacingScale,
    headingWeight: bp.headingWeight,
    letterSpacing: bp.letterSpacing,
    fontHeading: bp.fontHeading,
    fontBody: bp.fontBody,
  };
}

/**
 * A small mock composition (button, match-score badge, card, progress dots)
 * themed with the row's live in-progress draft — not the saved value — so
 * every color/typography/style edit is visible instantly, no save/refresh.
 * Hand-styled from the draft's resolved values rather than reusing
 * BrandTokenScope/.glass/Button: this panel renders inside the light
 * `.console` admin theme, whose own `.glass`/`.btn-primary` overrides would
 * otherwise mask exactly the styling differences it exists to demonstrate.
 */
function BrandLivePreview({ draft }: { draft: BrandDraft }) {
  const tokens = resolveBrandTokens(draft);
  const brand = draft.brand || FALLBACK.brand;
  const bg = draft.backgroundColor || FALLBACK.background;
  const text = draft.textColor || FALLBACK.text;
  const muted = draft.mutedTextColor || FALLBACK.muted;
  const success = draft.successColor || FALLBACK.success;
  const surface = draft.surfaceColor || FALLBACK.surface;
  const cardStyle = draft.cardStyle || "Glass";
  const buttonStyle = draft.buttonStyle || "Filled";

  const cardBg =
    cardStyle === "Solid"
      ? `rgb(${surface})`
      : cardStyle === "Outlined"
        ? "transparent"
        : "linear-gradient(135deg, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.02))";
  const cardBorder = cardStyle === "Outlined" ? `1px solid rgb(${brand} / 0.35)` : "1px solid rgb(255 255 255 / 0.09)";

  const buttonBg = buttonStyle === "Filled" ? `rgb(${brand})` : "transparent";
  const buttonColor = buttonStyle === "Filled" ? "#fff" : `rgb(${brand})`;
  const buttonBorder = buttonStyle === "Outline" ? `1px solid rgb(${brand} / 0.6)` : "none";

  return (
    <div className="overflow-hidden rounded-2xl p-5" style={{ background: `rgb(${bg})`, color: `rgb(${text})` }}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className="pointer-events-none inline-block px-4 py-2 text-sm font-medium"
          style={{ background: buttonBg, color: buttonColor, border: buttonBorder, borderRadius: tokens.radiusSm }}
        >
          View details
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ background: `rgb(${success} / 0.15)`, color: `rgb(${success})` }}
        >
          92% match
        </span>
      </div>

      <div
        className="mt-3 p-4"
        style={{ background: cardBg, border: cardBorder, borderRadius: tokens.radius, boxShadow: tokens.shadow }}
      >
        <h3
          className="text-base"
          style={{
            fontWeight: tokens.headingWeight,
            letterSpacing: tokens.letterSpacingHeading,
            fontFamily: fontStack(draft.fontHeading) || undefined,
          }}
        >
          Ocean View Residence
        </h3>
        <p className="mt-1 text-xs" style={{ color: `rgb(${muted})`, fontFamily: fontStack(draft.fontBody) || undefined }}>
          3 bed · 2 bath · 1,450 sqft
        </p>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-1.5 rounded-full"
            style={{ width: i === 1 ? "1.5rem" : "0.4rem", background: i === 1 ? `rgb(${brand})` : `rgb(${muted} / 0.4)` }}
          />
        ))}
      </div>
    </div>
  );
}

function BrandProfileRow({
  brandProfile,
  expanded,
  onToggle,
}: {
  brandProfile: BrandProfile;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [draft, setDraft] = useState<BrandDraft>(() => draftFromBrandProfile(brandProfile));
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- resync only when switching rows; the row's own edits are the source of truth in between, not re-fetched server state.
  useEffect(() => setDraft(draftFromBrandProfile(brandProfile)), [brandProfile.id]);

  /** Updates the draft (so the live preview reflects it instantly) and pushes the same patch to the server. */
  function patch(fields: Partial<BrandDraft>) {
    setDraft((d) => ({ ...d, ...fields }));
    updateBrandProfile(brandProfile.id, fields);
  }

  const bgTriplet = draft.backgroundColor || FALLBACK.background;
  const textContrast = contrastRatio(bgTriplet, draft.textColor || FALLBACK.text);
  const mutedContrast = contrastRatio(bgTriplet, draft.mutedTextColor || FALLBACK.muted);

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
        <div className="space-y-4 border-t border-zinc-100 px-4 py-3">
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Colors</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ColorField
                label="Primary color"
                value={draft.brand}
                fallback={FALLBACK.brand}
                onChange={(next) => patch({ brand: next })}
              />
              <ColorField
                label="Secondary / accent color"
                value={draft.brandSoft}
                fallback={FALLBACK.brandSoft}
                onChange={(next) => patch({ brandSoft: next })}
              />
              <ColorField
                label="Background"
                value={draft.backgroundColor}
                fallback={FALLBACK.background}
                onChange={(next) => patch({ backgroundColor: next })}
              />
              <ColorField
                label="Text"
                value={draft.textColor}
                fallback={FALLBACK.text}
                onChange={(next) => patch({ textColor: next })}
              />
              <ColorField
                label="Muted text"
                value={draft.mutedTextColor}
                fallback={FALLBACK.muted}
                onChange={(next) => patch({ mutedTextColor: next })}
              />
              <ColorField
                label="Surface"
                hint="Used for Solid-style cards"
                value={draft.surfaceColor}
                fallback={FALLBACK.surface}
                onChange={(next) => patch({ surfaceColor: next })}
              />
              <ColorField
                label="Success"
                value={draft.successColor}
                fallback={FALLBACK.success}
                onChange={(next) => patch({ successColor: next })}
              />
              <ColorField
                label="Warning"
                value={draft.warningColor}
                fallback={FALLBACK.warning}
                onChange={(next) => patch({ warningColor: next })}
              />
              <ColorField
                label="Danger"
                value={draft.dangerColor}
                fallback={FALLBACK.danger}
                onChange={(next) => patch({ dangerColor: next })}
              />
            </div>
            {textContrast < LOW_CONTRAST_THRESHOLD && (
              <p className="mt-2 text-[11px] text-amber-600">
                Low contrast between Background and Text — this may be hard to read on the Display.
              </p>
            )}
            {mutedContrast < LOW_CONTRAST_THRESHOLD && (
              <p className="mt-1 text-[11px] text-amber-600">
                Low contrast between Background and Muted text — captions and labels may be hard to read.
              </p>
            )}
          </div>

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
                value={draft.fontHeading ?? ""}
                onChange={(e) => patch({ fontHeading: e.target.value || null })}
              >
                <option value="">Default</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Body font">
              <Select
                value={draft.fontBody ?? ""}
                onChange={(e) => patch({ fontBody: e.target.value || null })}
              >
                <option value="">Default</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Heading weight">
              <Select
                value={draft.headingWeight}
                onChange={(e) => patch({ headingWeight: e.target.value })}
              >
                {HEADING_WEIGHT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Letter spacing">
              <Select
                value={draft.letterSpacing}
                onChange={(e) => patch({ letterSpacing: e.target.value })}
              >
                {LETTER_SPACING_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Style</span>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Card style">
                <Select value={draft.cardStyle} onChange={(e) => patch({ cardStyle: e.target.value })}>
                  {CARD_STYLE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Button style">
                <Select value={draft.buttonStyle} onChange={(e) => patch({ buttonStyle: e.target.value })}>
                  {BUTTON_STYLE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Border radius">
                <Select value={draft.borderRadius} onChange={(e) => patch({ borderRadius: e.target.value })}>
                  {BORDER_RADIUS_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Shadow intensity">
                <Select value={draft.shadowIntensity} onChange={(e) => patch({ shadowIntensity: e.target.value })}>
                  {SHADOW_INTENSITY_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Spacing" className="col-span-2">
                <Select value={draft.spacingScale} onChange={(e) => patch({ spacingScale: e.target.value })}>
                  {SPACING_SCALE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Live preview
            </span>
            <BrandLivePreview draft={draft} />
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

/**
 * The most-recently-created profile, presented as a premium hero card with
 * one-click actions — the "current profile" a client is actively working on
 * shouldn't require opening the editor just to publish or check status.
 * Everything here calls the exact same store functions/routes the editor's
 * own controls do, so there is no separate "quick action" code path to keep
 * in sync.
 */
function CurrentProfileCard({
  profile,
  onOpen,
}: {
  profile: DisplayProfile;
  onOpen: (id: string, initialTab?: EditorTab) => void;
}) {
  const pack = PACKS.find((p) => p.id === profile.packId);
  const item = pack?.inventory.find((i) => i.id === profile.itemId);
  const validation = item ? validateDisplayProfileForPublish(profile.sections, item, profile.assets) : undefined;
  const { versions } = useDisplayProfileVersions(profile.id);
  const rollbackTarget = versions.find((v) => !v.isCurrent) ?? null;

  const [publishOpen, setPublishOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Current profile
          </span>
          <div className="text-lg font-semibold text-zinc-900">{profile.name}</div>
          <div className="mt-0.5 text-xs text-zinc-400">
            {item?.name ?? "Listing removed"} · {pack?.label ?? profile.packId} · {profile.template}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cx("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium", STATUS_STYLE[profile.status])}>
            {profile.status}
          </span>
          <span className="text-[11px] text-zinc-400">Updated {new Date(profile.updatedAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onOpen(profile.id)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
        >
          <FileEdit className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={() => onOpen(profile.id, "Preview")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
        <button
          onClick={() => setPublishOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          <Rocket className="h-3.5 w-3.5" /> Publish
        </button>
        <button
          disabled={!rollbackTarget}
          title={rollbackTarget ? undefined : "No earlier published version to roll back to"}
          onClick={() => setRollbackOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Rollback
        </button>
        <button
          disabled={duplicating}
          onClick={async () => {
            setDuplicating(true);
            const copy = await duplicateDisplayProfile(profile.id);
            setDuplicating(false);
            if (copy) onOpen(copy.id);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          {duplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />} Duplicate
        </button>
      </div>

      {publishOpen && (
        <PublishDialog
          onClose={() => setPublishOpen(false)}
          onPublish={(changeReason) => {
            updateDisplayProfile(profile.id, { status: "Published", changeReason });
            setPublishOpen(false);
          }}
          validation={validation}
        />
      )}

      {rollbackOpen && rollbackTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRollbackOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-zinc-900">Roll back to v{rollbackTarget.version}?</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Published {new Date(rollbackTarget.createdAt).toLocaleString()}
              {rollbackTarget.changeReason ? ` — "${rollbackTarget.changeReason}"` : ""}. This creates a new version
              identical to it — the real Customer Display updates on its next poll, with no engineering involved.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setRollbackOpen(false)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                disabled={rollingBack}
                onClick={async () => {
                  setRollingBack(true);
                  await revertDisplayProfile(profile.id, rollbackTarget.id);
                  setRollingBack(false);
                  setRollbackOpen(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {rollingBack && <Loader2 className="h-4 w-4 animate-spin" />}
                Roll back
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [intent, setIntent] = useState("");
  const [aiSubmitting, setAiSubmitting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const items = pack?.inventory ?? [];

  async function createWithAi() {
    setAiSubmitting(true);
    setAiError(null);
    try {
      const profile = await createDisplayProfile({ packId, itemId, template });
      if (!profile) {
        setAiError("Could not create the draft. Try again.");
        return;
      }
      try {
        const res = await fetch("/api/ai/display-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: profile.id, intent: intent.trim() || undefined }),
        });
        if (res.ok) {
          const design = await res.json();
          await updateDisplayProfile(profile.id, {
            sections: design.sections,
            motion: { ...profile.motion, preset: design.motion.preset, reduceMotion: design.motion.reduceMotion },
            ...(design.template ? { template: design.template } : {}),
          });
        }
      } catch {
        // AI composition failed — the profile still exists as a normal blank draft, fully editable.
      }
      onCreated(profile.id);
    } finally {
      setAiSubmitting(false);
    }
  }

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

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">Describe it (optional)</span>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. a premium dark experience for a luxury waterfront development"
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
            <span className="mt-1 block text-[11px] text-zinc-400">
              LUMMA will pick widgets, motion, and a template from this listing&apos;s real data — it never invents facts.
            </span>
          </label>
          {aiError && <p className="text-xs text-red-600">{aiError}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            disabled={!packId || !itemId || submitting || aiSubmitting}
            onClick={async () => {
              setSubmitting(true);
              const profile = await createDisplayProfile({ packId, itemId, template });
              setSubmitting(false);
              if (profile) onCreated(profile.id);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
          <button
            disabled={!packId || !itemId || submitting || aiSubmitting}
            onClick={createWithAi}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {aiSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Create with AI
          </button>
        </div>
      </div>
    </div>
  );
}

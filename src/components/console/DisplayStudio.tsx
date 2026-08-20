"use client";

import { useState } from "react";
import { MonitorPlay, Plus, Loader2, Eye, EyeOff, FileEdit } from "lucide-react";
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
import { DisplayProfileEditor } from "@/components/console/DisplayProfileEditor";

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
];

export function DisplayStudio() {
  const { profiles, isLoading } = useDisplayProfiles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (selectedId) {
    return <DisplayProfileEditor id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
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

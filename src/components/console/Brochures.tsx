"use client";

import { useEffect, useState } from "react";
import { Globe, Plus, Loader2, Eye, EyeOff, FileEdit } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { PACKS } from "@/core/industries";
import { createBrochure, useBrochures, type Brochure, type BrochureStatus } from "@/core/store/brochures";
import { BrochureEditor } from "@/components/console/BrochureEditor";

const STATUS_STYLE: Record<BrochureStatus, string> = {
  Draft: "bg-zinc-200 text-zinc-500",
  Published: "bg-emerald-100 text-emerald-700",
  Archived: "bg-amber-100 text-amber-700",
};

/** A pending "Generate Brochure" request from the Inventory Builder — auto-creates and opens a brochure for that exact listing. */
export interface BrochureSeed {
  packId: string;
  itemId: string;
}

export function Brochures({
  seed,
  onSeedConsumed,
}: {
  seed?: BrochureSeed | null;
  onSeedConsumed?: () => void;
}) {
  const { brochures, isLoading } = useBrochures();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!seed) return;
    let cancelled = false;
    setCreating(true);
    createBrochure({ packId: seed.packId, itemId: seed.itemId }).then((brochure) => {
      if (cancelled) return;
      setCreating(false);
      onSeedConsumed?.();
      if (brochure) setSelectedId(brochure.id);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  if (selectedId) {
    return <BrochureEditor id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Brochures"
        right={
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" /> Generate brochure
          </button>
        }
      >
        {isLoading || creating ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {creating ? "Generating brochure…" : "Loading…"}
          </div>
        ) : brochures.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            No brochures yet. Generate one from a listing in Inventory, or use
            the button above.
          </p>
        ) : (
          <div className="space-y-2">
            {brochures.map((b) => (
              <BrochureRow key={b.id} brochure={b} onOpen={() => setSelectedId(b.id)} />
            ))}
          </div>
        )}
      </Panel>

      {pickerOpen && (
        <NewBrochurePicker
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

function BrochureRow({ brochure, onOpen }: { brochure: Brochure; onOpen: () => void }) {
  const pack = PACKS.find((p) => p.id === brochure.packId);
  const item = pack?.inventory.find((i) => i.id === brochure.itemId);

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-zinc-300"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-500">
        <Globe className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-zinc-900">
          {item?.name ?? "Listing removed"}
        </div>
        <div className="truncate text-xs text-zinc-400">
          {pack?.label ?? brochure.packId} · {brochure.template} · /b/{brochure.slug}
        </div>
      </div>
      <span
        className={cx(
          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
          STATUS_STYLE[brochure.status],
        )}
      >
        {brochure.status}
      </span>
      {brochure.status === "Published" ? (
        <Eye className="h-4 w-4 shrink-0 text-zinc-300" />
      ) : (
        <EyeOff className="h-4 w-4 shrink-0 text-zinc-300" />
      )}
      <FileEdit className="h-4 w-4 shrink-0 text-zinc-300" />
    </button>
  );
}

function NewBrochurePicker({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [packId, setPackId] = useState(PACKS[0]?.id ?? "");
  const pack = PACKS.find((p) => p.id === packId) ?? PACKS[0];
  const [itemId, setItemId] = useState(pack?.inventory[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  const items = pack?.inventory ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-zinc-900">Generate brochure</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Pick a listing to turn into a shareable microsite.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Pack
            </span>
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
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Listing
            </span>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
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
              const brochure = await createBrochure({ packId, itemId });
              setSubmitting(false);
              if (brochure) onCreated(brochure.id);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

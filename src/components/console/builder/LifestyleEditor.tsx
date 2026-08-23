"use client";

import { MapPin, Plus, Sparkles, X } from "lucide-react";
import type { Lifestyle, LifestyleMetric, NearbyAmenity, Poi } from "@/core/types";
import { Field, NumberInput, Select, TextArea, TextInput } from "./fields";

const POI_KINDS: Poi["kind"][] = [
  "school",
  "park",
  "shopping",
  "health",
  "transport",
  "leisure",
  "water",
];

/**
 * ~4.8 km/h — the standard real-estate "X min walk" assumption. Applied to a
 * real OpenStreetMap distance, never to a fabricated one.
 */
const WALK_METERS_PER_MIN = 80;

const AMENITY_KIND_META: Record<NearbyAmenity["kind"], { label: string; icon: string }> = {
  school: { label: "Schools", icon: "GraduationCap" },
  hospital: { label: "Hospitals", icon: "HeartPulse" },
  supermarket: { label: "Groceries", icon: "ShoppingCart" },
  park: { label: "Parks", icon: "Trees" },
  transport: { label: "Transport", icon: "TrainFront" },
  restaurant: { label: "Restaurants", icon: "Utensils" },
  other: { label: "Nearby", icon: "MapPin" },
};

function walkMinutes(distanceMeters: number): number {
  return Math.max(1, Math.round(distanceMeters / WALK_METERS_PER_MIN));
}

/**
 * Turns real Overpass-fetched amenities into the same "Amenity metrics"
 * shape the display renders — so the metrics are always the real numbers,
 * not a hand-typed guess. Never touches `pois`/`at`, which stay hand-placed
 * on the illustrative map stage.
 */
function buildAmenitySummary(amenities: NearbyAmenity[]): { metrics: LifestyleMetric[] } {
  const byKind = new Map<NearbyAmenity["kind"], NearbyAmenity[]>();
  for (const a of amenities) {
    const list = byKind.get(a.kind) ?? [];
    list.push(a);
    byKind.set(a.kind, list);
  }

  const metrics: LifestyleMetric[] = [];
  for (const [kind, list] of byKind) {
    const meta = AMENITY_KIND_META[kind];
    const nearest = list.reduce((a, b) => (a.distanceMeters < b.distanceMeters ? a : b));
    metrics.push({
      icon: meta.icon,
      label: meta.label,
      detail: `${list.length} within ${walkMinutes(nearest.distanceMeters)} min`,
    });
  }

  return { metrics };
}

function defaultLifestyle(district: string): Lifestyle {
  return {
    district,
    tags: ["Family"],
    summary: "Describe the neighbourhood and what life is like here.",
    beds: 3,
    sqm: 120,
    at: { x: 45, y: 43 },
    metrics: [
      { icon: "GraduationCap", label: "Schools", detail: "3 within 5 min" },
      { icon: "Trees", label: "Parks", detail: "4 within 10 min" },
    ],
    pois: [
      {
        id: "poi-1",
        icon: "MapPin",
        label: "Point of interest",
        detail: "5 min",
        x: 50,
        y: 40,
        kind: "leisure",
      },
    ],
  };
}

export function LifestyleEditor({
  lifestyle,
  itemName,
  nearbyAmenities,
  onChange,
}: {
  lifestyle: Lifestyle | undefined;
  itemName: string;
  nearbyAmenities?: NearbyAmenity[];
  onChange: (next: Lifestyle | undefined) => void;
}) {
  if (!lifestyle) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
        <p className="mb-2 text-xs text-ink-faint">
          No lifestyle-map scene. Add one to place this item on the Interactive
          Lifestyle Map with amenities and walking routes.
        </p>
        <button
          onClick={() => onChange(defaultLifestyle(itemName || "New district"))}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand/15 px-3 py-1.5 text-xs font-medium text-brand ring-1 ring-brand/25 transition hover:bg-brand/25"
        >
          <MapPin className="h-3.5 w-3.5" /> Add map scene
        </button>
      </div>
    );
  }

  const patch = (p: Partial<Lifestyle>) => onChange({ ...lifestyle, ...p });
  const districtMismatch = itemName.trim() !== "" && lifestyle.district.trim() !== itemName.trim();

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-muted">
          Lifestyle map scene
        </span>
        <button
          onClick={() => onChange(undefined)}
          className="text-[11px] text-ink-faint transition hover:text-rose-300"
        >
          Remove scene
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="District"
          hint={
            districtMismatch
              ? `Shown on the customer display — doesn't match the item name "${itemName}"`
              : undefined
          }
        >
          <div className="flex gap-2">
            <TextInput
              value={lifestyle.district}
              onChange={(e) => patch({ district: e.target.value })}
              className="flex-1"
            />
            {districtMismatch && (
              <button
                onClick={() => patch({ district: itemName })}
                className="shrink-0 whitespace-nowrap rounded-xl border border-amber-400/30 bg-amber-400/10 px-2.5 py-2 text-[11px] text-amber-300 transition hover:bg-amber-400/20"
              >
                Use item name
              </button>
            )}
          </div>
        </Field>
        <StringList
          label="Tags"
          values={lifestyle.tags}
          onChange={(tags) => patch({ tags })}
        />
      </div>

      <Field label="Summary">
        <TextArea
          rows={2}
          value={lifestyle.summary}
          onChange={(e) => patch({ summary: e.target.value })}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Beds">
          <NumberInput value={lifestyle.beds} onValue={(beds) => patch({ beds })} />
        </Field>
        <Field label="m²">
          <NumberInput value={lifestyle.sqm} onValue={(sqm) => patch({ sqm })} />
        </Field>
        <Field label="Map X %" hint="0–100">
          <NumberInput
            value={lifestyle.at.x}
            min={0}
            max={100}
            onValue={(x) => patch({ at: { ...lifestyle.at, x: x ?? 0 } })}
          />
        </Field>
        <Field label="Map Y %" hint="0–100">
          <NumberInput
            value={lifestyle.at.y}
            min={0}
            max={100}
            onValue={(y) => patch({ at: { ...lifestyle.at, y: y ?? 0 } })}
          />
        </Field>
      </div>

      {nearbyAmenities && nearbyAmenities.length > 0 && (
        <button
          onClick={() => patch(buildAmenitySummary(nearbyAmenities))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand/25 bg-brand/10 px-2.5 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/20"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Sync amenity metrics from nearby amenities
        </button>
      )}

      <MetricList
        label="Amenity metrics"
        metrics={lifestyle.metrics}
        onChange={(metrics) => patch({ metrics })}
      />
      <PoiList pois={lifestyle.pois} onChange={(pois) => patch({ pois })} />
    </div>
  );
}

function StringList({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={v}
              onChange={(e) =>
                onChange(values.map((x, idx) => (idx === i ? e.target.value : x)))
              }
              className="flex-1"
            />
            <RemoveBtn onClick={() => onChange(values.filter((_, idx) => idx !== i))} />
          </div>
        ))}
        <AddBtn onClick={() => onChange([...values, ""])} label="Add tag" />
      </div>
    </Field>
  );
}

function MetricList({
  label,
  metrics,
  onChange,
}: {
  label: string;
  metrics: LifestyleMetric[];
  onChange: (next: LifestyleMetric[]) => void;
}) {
  const set = (i: number, p: Partial<LifestyleMetric>) =>
    onChange(metrics.map((m, idx) => (idx === i ? { ...m, ...p } : m)));
  return (
    <Field label={label} hint="Icon is a lucide-react name (e.g. Trees, Waves)">
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={m.icon}
              onChange={(e) => set(i, { icon: e.target.value })}
              placeholder="Icon"
              className="w-32"
            />
            <TextInput
              value={m.label}
              onChange={(e) => set(i, { label: e.target.value })}
              placeholder="Label"
              className="flex-1"
            />
            <TextInput
              value={m.detail}
              onChange={(e) => set(i, { detail: e.target.value })}
              placeholder="Detail"
              className="flex-1"
            />
            <RemoveBtn onClick={() => onChange(metrics.filter((_, idx) => idx !== i))} />
          </div>
        ))}
        <AddBtn
          onClick={() =>
            onChange([...metrics, { icon: "MapPin", label: "", detail: "" }])
          }
          label="Add metric"
        />
      </div>
    </Field>
  );
}

function PoiList({
  pois,
  onChange,
}: {
  pois: Poi[];
  onChange: (next: Poi[]) => void;
}) {
  const set = (i: number, p: Partial<Poi>) =>
    onChange(pois.map((poi, idx) => (idx === i ? { ...poi, ...p } : poi)));
  return (
    <Field label="Points of interest" hint="Positioned on the map by X/Y percentage">
      <div className="space-y-2">
        {pois.map((p, i) => (
          <div
            key={p.id}
            className="grid grid-cols-2 gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 sm:grid-cols-[1fr_1fr_0.8fr_0.6fr_0.6fr_auto]"
          >
            <TextInput
              value={p.label}
              onChange={(e) => set(i, { label: e.target.value })}
              placeholder="Label"
            />
            <TextInput
              value={p.detail}
              onChange={(e) => set(i, { detail: e.target.value })}
              placeholder="Detail (5 min)"
            />
            <Select
              value={p.kind}
              onChange={(e) => set(i, { kind: e.target.value as Poi["kind"] })}
            >
              {POI_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
            <NumberInput
              value={p.x}
              min={0}
              max={100}
              onValue={(x) => set(i, { x: x ?? 0 })}
              placeholder="X"
            />
            <NumberInput
              value={p.y}
              min={0}
              max={100}
              onValue={(y) => set(i, { y: y ?? 0 })}
              placeholder="Y"
            />
            <RemoveBtn onClick={() => onChange(pois.filter((_, idx) => idx !== i))} />
          </div>
        ))}
        <AddBtn
          onClick={() =>
            onChange([
              ...pois,
              {
                id: `poi-${Math.random().toString(36).slice(2, 7)}`,
                icon: "MapPin",
                label: "Point of interest",
                detail: "5 min",
                x: 50,
                y: 40,
                kind: "leisure",
              },
            ])
          }
          label="Add point of interest"
        />
      </div>
    </Field>
  );
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-muted transition hover:bg-white/5"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint transition hover:bg-white/5 hover:text-rose-300"
      aria-label="Remove"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

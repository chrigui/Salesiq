"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Globe,
  Instagram,
  Download,
  Loader2,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File as FileIcon,
  MapPin,
  Navigation,
  School,
  ShoppingCart,
  Trees,
  Bus,
  UtensilsCrossed,
  HeartPulse,
} from "lucide-react";
import { cx, GRADIENTS } from "@/components/ui/primitives";
import { getEffectivePack, saveInventory } from "@/core/store/packs";
import type { InventoryItem, NearbyAmenity } from "@/core/types";
import { Field, NumberInput, TextInput } from "./fields";
import { LifestyleEditor } from "./LifestyleEditor";

const GRADIENT_TOKENS = Object.keys(GRADIENTS);

function blankItem(currency: string): InventoryItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 7)}`,
    name: "New item",
    subtitle: "",
    price: 100000,
    currency,
    image: "violet",
    attributes: {},
    highlights: [],
  };
}

export function InventoryBuilder({
  packId,
  onGenerateBrochure,
}: {
  packId: string;
  /** Optional: lets "Generate Brochure" hand off to the Brochures tab for this exact listing. */
  onGenerateBrochure?: (packId: string, itemId: string) => void;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const currency = getEffectivePack(packId).currency;

  useEffect(() => {
    setItems(getEffectivePack(packId).inventory);
    setOpenId(null);
  }, [packId]);

  const commit = (next: InventoryItem[]) => {
    setItems(next);
    saveInventory(packId, next);
  };

  const update = (id: string, patch: Partial<InventoryItem>) =>
    commit(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const remove = (id: string) => commit(items.filter((it) => it.id !== id));

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[index], next[to]] = [next[to], next[index]];
    commit(next);
  };

  const add = () => {
    const it = blankItem(currency);
    commit([...items, it]);
    setOpenId(it.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-faint">
          {items.length} item{items.length === 1 ? "" : "s"} · scored live
          against every customer&apos;s answers
        </p>
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add item
        </button>
      </div>

      <div className="space-y-2">
        {items.map((it, i) => (
          <ItemRow
            key={it.id}
            packId={packId}
            item={it}
            index={i}
            total={items.length}
            open={openId === it.id}
            onToggle={() => setOpenId(openId === it.id ? null : it.id)}
            onChange={(patch) => update(it.id, patch)}
            onRemove={() => remove(it.id)}
            onMove={(dir) => move(i, dir)}
            onGenerateBrochure={onGenerateBrochure && (() => onGenerateBrochure(packId, it.id))}
          />
        ))}
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-ink-faint">
            No inventory yet. Add an item to see it scored on the display.
          </div>
        )}
      </div>
    </div>
  );
}

function ItemRow({
  packId,
  item,
  index,
  total,
  open,
  onToggle,
  onChange,
  onRemove,
  onMove,
  onGenerateBrochure,
}: {
  packId: string;
  item: InventoryItem;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<InventoryItem>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onGenerateBrochure?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className={cx(
            "h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br",
            GRADIENTS[item.image] ?? GRADIENTS.violet,
          )}
        />
        <button onClick={onToggle} className="flex-1 text-left">
          <div className="text-sm font-medium">{item.name || "Untitled"}</div>
          <div className="text-[11px] text-ink-faint">
            {item.currency} {item.price.toLocaleString()}
            {item.subtitle ? ` · ${item.subtitle}` : ""}
          </div>
        </button>
        <div className="flex items-center gap-0.5">
          {onGenerateBrochure && (
            <IconBtn label="Generate brochure" onClick={onGenerateBrochure}>
              <Globe className="h-3.5 w-3.5" />
            </IconBtn>
          )}
          <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn
            label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Delete" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
          <button
            onClick={onToggle}
            className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint hover:bg-white/5"
          >
            <ChevronDown className={cx("h-4 w-4 transition", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-white/5 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <TextInput
                value={item.name}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </Field>
            <Field label="Subtitle">
              <TextInput
                value={item.subtitle}
                onChange={(e) => onChange({ subtitle: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Price">
              <NumberInput
                value={item.price}
                min={0}
                onValue={(price) => onChange({ price: price ?? 0 })}
              />
            </Field>
            <Field label="Currency">
              <TextInput
                value={item.currency}
                maxLength={3}
                onChange={(e) =>
                  onChange({ currency: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field label="Appreciation %" hint="Optional, used by investment scoring">
              <NumberInput
                value={item.appreciation}
                onValue={(appreciation) => onChange({ appreciation })}
              />
            </Field>
          </div>

          <Field label="Photo URL" hint="Falls back to the gradient if it fails to load">
            <TextInput
              value={item.photo ?? ""}
              placeholder="https://…"
              onChange={(e) => onChange({ photo: e.target.value || undefined })}
            />
          </Field>

          <ProjectLinks item={item} onChange={onChange} />

          <Field label="Accent gradient">
            <div className="flex flex-wrap gap-2">
              {GRADIENT_TOKENS.map((token) => (
                <button
                  key={token}
                  onClick={() => onChange({ image: token })}
                  className={cx(
                    "h-8 w-12 rounded-lg bg-gradient-to-br ring-2 transition",
                    GRADIENTS[token],
                    item.image === token
                      ? "ring-brand"
                      : "ring-transparent hover:ring-white/20",
                  )}
                  aria-label={token}
                />
              ))}
            </div>
          </Field>

          <HighlightsEditor
            highlights={item.highlights}
            onChange={(highlights) => onChange({ highlights })}
          />

          <GalleryEditor
            gallery={item.gallery ?? []}
            onChange={(gallery) => onChange({ gallery })}
          />

          <AttributesEditor
            attributes={item.attributes}
            onChange={(attributes) => onChange({ attributes })}
          />

          <LocationEditor item={item} onChange={onChange} />

          <LifestyleEditor
            lifestyle={item.lifestyle}
            onChange={(lifestyle) => onChange({ lifestyle })}
          />

          <ItemAssetsPanel
            packId={packId}
            itemId={item.id}
            onImageUploaded={(url) => onChange({ gallery: [...(item.gallery ?? []), url] })}
          />
        </div>
      )}
    </div>
  );
}

function HighlightsEditor({
  highlights,
  onChange,
}: {
  highlights: string[];
  onChange: (next: string[]) => void;
}) {
  const set = (i: number, v: string) =>
    onChange(highlights.map((h, idx) => (idx === i ? v : h)));
  const remove = (i: number) => onChange(highlights.filter((_, idx) => idx !== i));
  const add = () => onChange([...highlights, ""]);
  return (
    <Field label="Highlights" hint="Bullet points surfaced on the card">
      <div className="space-y-2">
        {highlights.map((h, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={h}
              onChange={(e) => set(i, e.target.value)}
              className="flex-1"
            />
            <button
              onClick={() => remove(i)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-white/5 hover:text-rose-300"
              aria-label="Remove highlight"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-muted transition hover:bg-white/5"
        >
          <Plus className="h-3.5 w-3.5" /> Add highlight
        </button>
      </div>
    </Field>
  );
}

function GalleryEditor({
  gallery,
  onChange,
}: {
  gallery: string[];
  onChange: (next: string[]) => void;
}) {
  const set = (i: number, v: string) => onChange(gallery.map((g, idx) => (idx === i ? v : g)));
  const remove = (i: number) => onChange(gallery.filter((_, idx) => idx !== i));
  const add = () => onChange([...gallery, ""]);
  return (
    <Field label="Gallery" hint="Extra photo URLs shown on the Brochure and Customer Display gallery widgets">
      <div className="space-y-2">
        {gallery.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
            )}
            <TextInput
              value={url}
              placeholder="https://…"
              onChange={(e) => set(i, e.target.value)}
              className="flex-1"
            />
            <button
              onClick={() => remove(i)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-white/5 hover:text-rose-300"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-muted transition hover:bg-white/5"
        >
          <Plus className="h-3.5 w-3.5" /> Add image URL
        </button>
      </div>
    </Field>
  );
}

/**
 * The project's own website and Instagram — the website can be fetched to
 * auto-fill this item (see fetchAndFill below); Instagram has no public API
 * to bulk-import a profile's photos, so it's stored as a reference link
 * only — any photos worth reusing get added via the file upload panel below.
 */
function ProjectLinks({
  item,
  onChange,
}: {
  item: InventoryItem;
  onChange: (patch: Partial<InventoryItem>) => void;
}) {
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndFill = async () => {
    const url = item.websiteUrl?.trim();
    if (!url) return;
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/fetch-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Couldn't import that site.");
        return;
      }
      const { title, description, images, highlights } = data as {
        title: string;
        description: string;
        images: string[];
        highlights: string[];
      };
      const existingGallery = item.gallery ?? [];
      const newImages = images.filter((img) => !existingGallery.includes(img));
      const existingHighlights = item.highlights;
      const newHighlights = highlights.filter((h) => !existingHighlights.includes(h));
      onChange({
        name: !item.name || item.name === "New item" ? title || item.name : item.name,
        subtitle: description || item.subtitle,
        photo: item.photo ?? images[0],
        gallery: [...existingGallery, ...newImages],
        highlights: [...existingHighlights, ...newHighlights],
      });
    } catch {
      setError("Couldn't reach that site.");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Website URL" hint={error ?? "Fetches the title, description, photos and feature highlights to fill this item"}>
        <div className="flex gap-2">
          <TextInput
            value={item.websiteUrl ?? ""}
            placeholder="https://…"
            onChange={(e) => onChange({ websiteUrl: e.target.value || undefined })}
            className="flex-1"
          />
          <button
            onClick={fetchAndFill}
            disabled={!item.websiteUrl?.trim() || fetching}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-ink-muted transition hover:bg-white/5 disabled:opacity-40"
          >
            {fetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
            Fetch & fill
          </button>
        </div>
      </Field>
      <Field label="Instagram URL" hint="Reference link only — upload any photos you want to reuse below">
        <div className="flex items-center gap-2">
          <Instagram className="h-4 w-4 shrink-0 text-ink-faint" />
          <TextInput
            value={item.instagramUrl ?? ""}
            placeholder="https://instagram.com/…"
            onChange={(e) => onChange({ instagramUrl: e.target.value || undefined })}
            className="flex-1"
          />
        </div>
      </Field>
    </div>
  );
}

const AMENITY_ICONS: Record<NearbyAmenity["kind"], typeof MapPin> = {
  school: School,
  hospital: HeartPulse,
  supermarket: ShoppingCart,
  park: Trees,
  transport: Bus,
  restaurant: UtensilsCrossed,
  other: MapPin,
};

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

/**
 * Real geographic location + real nearby amenities, both fetched from
 * OpenStreetMap (Nominatim for geocoding, Overpass for amenities) —
 * deliberately kept separate from `lifestyle.pois`, which are hand-placed
 * illustrative positions on an artistic map stage with no real coordinates.
 * Mixing the two would mean fabricating either a stage position for a real
 * place or a real distance for an illustrated one, so this list stays a
 * plain, factual read-out instead of being plotted onto that map.
 */
function LocationEditor({
  item,
  onChange,
}: {
  item: InventoryItem;
  onChange: (patch: Partial<InventoryItem>) => void;
}) {
  const [query, setQuery] = useState(item.location?.label ?? "");
  const [locating, setLocating] = useState(false);
  const [findingAmenities, setFindingAmenities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = async () => {
    const q = query.trim();
    if (!q) return;
    setLocating(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Couldn't find that location.");
        return;
      }
      const { label, lat, lng } = data as { label: string; lat: number; lng: number };
      onChange({ location: { label, lat, lng }, nearbyAmenities: undefined });
    } catch {
      setError("Couldn't reach the location service.");
    } finally {
      setLocating(false);
    }
  };

  const findAmenities = async () => {
    if (!item.location) return;
    setFindingAmenities(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/nearby-amenities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: item.location.lat, lng: item.location.lng }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Couldn't find nearby amenities.");
        return;
      }
      onChange({ nearbyAmenities: (data as { amenities: NearbyAmenity[] }).amenities });
    } catch {
      setError("Couldn't reach the amenities service.");
    } finally {
      setFindingAmenities(false);
    }
  };

  return (
    <div className="space-y-3">
      <Field label="Location" hint={error ?? "Geocodes a real address to an exact lat/lng via OpenStreetMap"}>
        <div className="flex gap-2">
          <TextInput
            value={query}
            placeholder="Address or project name…"
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <button
            onClick={locate}
            disabled={!query.trim() || locating}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-ink-muted transition hover:bg-white/5 disabled:opacity-40"
          >
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
            Locate
          </button>
        </div>
      </Field>

      {item.location && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            <span className="truncate">{item.location.label}</span>
            <span className="shrink-0 text-ink-faint">
              {item.location.lat.toFixed(5)}, {item.location.lng.toFixed(5)}
            </span>
          </div>
          <button
            onClick={findAmenities}
            disabled={findingAmenities}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-muted transition hover:bg-white/5 disabled:opacity-40"
          >
            {findingAmenities ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <School className="h-3.5 w-3.5" />}
            Find nearby amenities
          </button>
        </div>
      )}

      {item.nearbyAmenities && item.nearbyAmenities.length > 0 && (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {item.nearbyAmenities.map((a, i) => {
            const Icon = AMENITY_ICONS[a.kind];
            return (
              <div
                key={`${a.name}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-xs text-ink-muted"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                <span className="flex-1 truncate">{a.name}</span>
                <span className="shrink-0 text-ink-faint">{formatDistance(a.distanceMeters)}</span>
              </div>
            );
          })}
        </div>
      )}
      {item.nearbyAmenities && item.nearbyAmenities.length === 0 && (
        <p className="text-xs text-ink-faint">No named amenities found within 2km on OpenStreetMap.</p>
      )}
    </div>
  );
}

interface ItemAsset {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function assetIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  return FileIcon;
}

/**
 * Extra project materials — floor plans, payment plans, extra photos —
 * stored server-side (unlike the rest of this item's fields, which are
 * still localStorage-only; see saveInventory). Uploading an image adds it
 * straight to the Gallery above, so it shows up on the Brochure/Display
 * gallery widgets with no extra step; PDFs and spreadsheets stay in this
 * reference list only.
 */
function ItemAssetsPanel({
  packId,
  itemId,
  onImageUploaded,
}: {
  packId: string;
  itemId: string;
  onImageUploaded: (url: string) => void;
}) {
  const [assets, setAssets] = useState<ItemAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const basePath = `/api/inventory-items/${packId}/${itemId}/assets`;

  const load = () => {
    setLoading(true);
    fetch(basePath)
      .then((res) => res.json())
      .then((data) => setAssets(data.assets ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, itemId]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(basePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, mimeType: file.type, dataBase64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "unsupported-file-type"
            ? "That file type isn't supported (images, PDF, .xlsx/.xls only)."
            : data.error === "file-too-large"
              ? "That file is too large (8MB max)."
              : "Upload failed.",
        );
        return;
      }
      setAssets((prev) => [data.asset, ...prev]);
      if (file.type.startsWith("image/")) {
        onImageUploaded(`/api/public/inventory-items/${packId}/${itemId}/assets/${data.asset.id}`);
      }
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    await fetch(`${basePath}/${assetId}`, { method: "DELETE" });
  };

  return (
    <Field label="Project files" hint={error ?? "Floor plans, payment plans, extra photos — up to 8MB each"}>
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-xs text-ink-faint">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </div>
        ) : (
          assets.map((a) => {
            const Icon = assetIcon(a.mimeType);
            return (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5">
                <Icon className="h-4 w-4 shrink-0 text-ink-faint" />
                <span className="flex-1 truncate text-xs">{a.name}</span>
                <span className="shrink-0 text-[10px] text-ink-faint">{formatBytes(a.sizeBytes)}</span>
                <a
                  href={`${basePath}/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-white/5"
                  aria-label="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => remove(a.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-white/5 hover:text-rose-300"
                  aria-label="Delete"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-muted transition hover:bg-white/5">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload file
          <input
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/webp,application/pdf,.xlsx,.xls"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </Field>
  );
}

type AttrValue = number | string | boolean;

/** Coerce a free-text value into the number / boolean / string the engine uses. */
function coerceAttr(raw: string): AttrValue {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t !== "" && !Number.isNaN(Number(t))) return Number(t);
  return raw;
}

function AttributesEditor({
  attributes,
  onChange,
}: {
  attributes: Record<string, AttrValue>;
  onChange: (next: Record<string, AttrValue>) => void;
}) {
  const entries = Object.entries(attributes);

  const rebuild = (rows: [string, AttrValue][]) => {
    const obj: Record<string, AttrValue> = {};
    for (const [k, v] of rows) if (k.trim()) obj[k.trim()] = v;
    onChange(obj);
  };
  const setKey = (i: number, key: string) =>
    rebuild(entries.map((e, idx) => (idx === i ? [key, e[1]] : e)));
  const setVal = (i: number, val: string) =>
    rebuild(entries.map((e, idx) => (idx === i ? [e[0], coerceAttr(val)] : e)));
  const remove = (i: number) => rebuild(entries.filter((_, idx) => idx !== i));
  const add = () => rebuild([...entries, ["attribute", ""]]);

  return (
    <Field
      label="Attributes"
      hint="Matched by the scoring rules (e.g. bedrooms: 4, seaView: true)"
    >
      <div className="space-y-2">
        {entries.map(([k, v], i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={k}
              onChange={(e) => setKey(i, e.target.value)}
              placeholder="key"
              className="w-40"
            />
            <TextInput
              value={String(v)}
              onChange={(e) => setVal(i, e.target.value)}
              placeholder="value"
              className="flex-1"
            />
            <button
              onClick={() => remove(i)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-white/5 hover:text-rose-300"
              aria-label="Remove attribute"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-muted transition hover:bg-white/5"
        >
          <Plus className="h-3.5 w-3.5" /> Add attribute
        </button>
      </div>
    </Field>
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
      className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint transition hover:bg-white/5 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

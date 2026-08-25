"use client";

import { useState } from "react";
import {
  ChevronLeft,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Star,
  Bookmark,
  BookmarkCheck,
  ScreenShare,
  Check,
  Download,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File as FileIcon,
  Loader2,
  TrendingUp,
  Compass,
} from "lucide-react";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { useSession } from "@/core/store/session";
import { logBuyerActivity } from "@/core/store/buyerProfiles";
import { narrate, formatMoney } from "@/core/engine/explain";
import { haversineMeters } from "@/lib/geoMath";
import { deriveAvailabilityLabel } from "@/lib/availability";
import { metersToMinutes } from "../discoveryScoring";
import { ItemImage } from "@/components/ui/ItemImage";
import { cx } from "@/components/ui/primitives";
import { readPropertyAttributes } from "./attributeDisplay";
import { useItemAssets } from "./useItemAssets";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{title}</div>
      {children}
    </div>
  );
}

/**
 * The full contextual Property Details screen — everything PropertyPreview
 * doesn't have room for. Every section reads real data only: Floor Plan and
 * Payment documents come from the real InventoryItemAsset store (the same
 * endpoint Inventory Studio's admin panel uses), Investment never computes
 * a rental yield (deliberately diverging from LifestyleMap.tsx's existing
 * fabricated-yield formula), and real nearbyAmenities distances stay
 * visually separate from illustrative lifestyle.pois — never merged.
 */
export function PropertyDetails({
  pack,
  scored,
  onBack,
}: {
  pack: IndustryPack;
  scored: ScoredItem;
  onBack: () => void;
}) {
  const session = useSession();
  const { item, score, reasons } = scored;
  const attrs = readPropertyAttributes(pack, item);
  const whyItFits = reasons.length > 0 ? reasons.slice(0, 5) : [narrate(scored, pack)];
  const shortlisted = session.bookmarks.includes(item.id);
  const availability = deriveAvailabilityLabel(item);

  const [activePhoto, setActivePhoto] = useState(item.photo);
  const photos = [item.photo, ...(item.gallery ?? [])].filter((p): p is string => !!p);

  const { assets, loading: assetsLoading } = useItemAssets(pack.id, item.id);

  // Amenities: every toggle-type question the pack itself defines, shown
  // only when this item's own attributes actually say yes — never a
  // hardcoded real-estate-only list, so this degrades cleanly for packs
  // with no toggle questions at all (e.g. the Bahrain pack).
  const amenities = pack.questions
    .filter((q) => q.type === "toggle" && item.attributes[q.id] === true)
    .map((q) => q.label);

  const workDistanceMinutes =
    session.workLocationLat != null && session.workLocationLng != null && item.location
      ? metersToMinutes(
          haversineMeters(session.workLocationLat, session.workLocationLng, item.location.lat, item.location.lng),
        )
      : null;

  const showCustomer = () => session.focusItem(item.id);
  const toggleShortlist = () => {
    const adding = !shortlisted;
    session.toggleBookmark(item.id);
    if (adding && session.buyerProfileId) {
      void logBuyerActivity(session.buyerProfileId, { kind: "item_saved", packId: pack.id, itemId: item.id });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-aurora">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-6">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <ItemImage image={item.image} photo={activePhoto} className="h-56 w-full rounded-[1.6rem]">
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
            {score}% MATCH
          </div>
        </ItemImage>

        {photos.length > 1 && (
          <div className="mt-2.5 flex gap-2 overflow-x-auto">
            {photos.map((p, i) => (
              <button
                key={p}
                onClick={() => setActivePhoto(p)}
                aria-label={`Show photo ${i + 1}`}
                className={cx(
                  "h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition",
                  activePhoto === p ? "ring-brand" : "opacity-60 ring-transparent hover:opacity-90",
                )}
              >
                <ItemImage image={item.image} photo={p} className="h-full w-full" />
              </button>
            ))}
          </div>
        )}

        <div>
          <h1 className="mt-4 text-xl font-semibold text-ink">{item.name}</h1>
          {item.location?.label && (
            <div className="mt-1 flex items-center gap-1 text-sm text-ink-faint">
              <MapPin className="h-3.5 w-3.5" />
              {item.location.label}
            </div>
          )}
          <div className="mt-2 text-2xl font-semibold text-brand">{formatMoney(item.price, item.currency)}</div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-muted">
            {attrs.propertyType && <span>{attrs.propertyType}</span>}
            {attrs.bedrooms !== null && (
              <span className="flex items-center gap-1.5">
                <Bed className="h-4 w-4" />
                {attrs.bedrooms} bed{attrs.bedrooms === 1 ? "" : "s"}
              </span>
            )}
            {attrs.bathrooms !== null && (
              <span className="flex items-center gap-1.5">
                <Bath className="h-4 w-4" />
                {attrs.bathrooms} bath{attrs.bathrooms === 1 ? "" : "s"}
              </span>
            )}
            {(attrs.areaSqm ?? attrs.plotSize) !== null && (
              <span className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4" />
                {attrs.areaSqm ?? attrs.plotSize} m²
              </span>
            )}
          </div>

          {item.highlights.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.highlights.map((h) => (
                <span key={h} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-ink-faint ring-1 ring-white/10">
                  {h}
                </span>
              ))}
            </div>
          )}

          <Section title="Why it fits">
            <ul className="space-y-1.5">
              {whyItFits.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {r}
                </li>
              ))}
            </ul>
          </Section>

          {amenities.length > 0 && (
            <Section title="Amenities">
              <div className="flex flex-wrap gap-1.5">
                {amenities.map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-ink-muted ring-1 ring-white/10"
                  >
                    <Check className="h-3 w-3 text-brand" />
                    {a}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <Section title="Location & lifestyle">
            {workDistanceMinutes !== null && (
              <div className="mb-2 flex items-center gap-2 text-sm text-ink">
                <Compass className="h-4 w-4 text-brand" />
                ~{workDistanceMinutes} min from your stated workplace
              </div>
            )}
            {item.nearbyAmenities && item.nearbyAmenities.length > 0 && (
              <div className="mb-3">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  Nearby (real distances)
                </div>
                <ul className="space-y-1">
                  {item.nearbyAmenities.slice(0, 6).map((a, i) => (
                    <li key={i} className="flex items-center justify-between text-sm text-ink-muted">
                      <span>{a.name}</span>
                      <span className="text-ink-faint">~{metersToMinutes(a.distanceMeters)} min</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.lifestyle && item.lifestyle.pois.length > 0 && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  Neighborhood highlights (illustrative)
                </div>
                <ul className="space-y-1">
                  {item.lifestyle.pois.slice(0, 6).map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm italic text-ink-faint">
                      <span>{p.label}</span>
                      <span>{p.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {workDistanceMinutes === null &&
              !(item.nearbyAmenities && item.nearbyAmenities.length > 0) &&
              !(item.lifestyle && item.lifestyle.pois.length > 0) && (
                <p className="text-sm text-ink-faint">No location details available for this property.</p>
              )}
          </Section>

          <Section title="Floor plan & payment documents">
            {assetsLoading ? (
              <div className="flex items-center gap-2 py-1 text-sm text-ink-faint">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
              </div>
            ) : assets.length === 0 ? (
              <p className="text-sm text-ink-faint">No documents uploaded for this property.</p>
            ) : (
              <div className="space-y-1.5">
                {assets.map((a) => {
                  const Icon = assetIcon(a.mimeType);
                  return (
                    <a
                      key={a.id}
                      href={`/api/inventory-items/${pack.id}/${item.id}/assets/${a.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-sm transition hover:bg-white/5"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-ink-faint" />
                      <span className="flex-1 truncate text-ink">{a.name}</span>
                      <span className="shrink-0 text-xs text-ink-faint">{formatBytes(a.sizeBytes)}</span>
                      <Download className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                    </a>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title="Investment">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-faint">Price</span>
              <span className="text-ink">{formatMoney(item.price, item.currency)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-ink-faint">Appreciation</span>
              <span className="flex items-center gap-1 text-ink">
                {item.appreciation !== undefined ? (
                  <>
                    <TrendingUp className="h-3.5 w-3.5 text-brand" />+{item.appreciation}% / 3yr
                  </>
                ) : (
                  "Not available"
                )}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-ink-faint">Rental yield</span>
              <span className="text-ink-faint">Not available</span>
            </div>
          </Section>

          <Section title="Availability">
            {availability ? (
              <div className="flex items-center justify-between text-sm">
                <span
                  className={cx(
                    "flex items-center gap-1.5 font-semibold",
                    availability === "Available" ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {availability}
                </span>
                {item.unitsLeft !== undefined && item.totalUnits !== undefined && (
                  <span className="text-ink-faint">
                    {item.unitsLeft} of {item.totalUnits} units remaining
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-faint">Not available.</p>
            )}
          </Section>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={showCustomer}
              className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-110"
            >
              <ScreenShare className="h-3.5 w-3.5" />
              Show customer
            </button>
            <button
              onClick={toggleShortlist}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
            >
              {shortlisted ? <BookmarkCheck className="h-3.5 w-3.5 text-brand" /> : <Bookmark className="h-3.5 w-3.5" />}
              {shortlisted ? "In shortlist" : "Add to shortlist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

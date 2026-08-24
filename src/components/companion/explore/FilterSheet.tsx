"use client";

import { X } from "lucide-react";
import type { IndustryPack, Question } from "@/core/types";
import { cx } from "@/components/ui/primitives";
import { BudgetControl } from "../CompanionApp";
import {
  type ExploreFilters,
  availablePropertyTypes,
  availableBedroomCounts,
  availableLocations,
  availableFeatureKeys,
  featureLabel,
  priceBounds,
  hasAnyAvailabilityData,
  hasActiveFilters,
} from "./filterEngine";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "rounded-full px-3 py-1.5 text-xs font-medium transition",
        active ? "bg-brand text-white" : "bg-white/5 text-ink-muted hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * Contextual filters, shown only when the current pack's real inventory
 * actually has something to filter on — never a fixed, always-full list of
 * every possible facet. Filter state is owned by the caller (Companion-
 * local, scoped to the current meeting) and passed in/out here.
 */
export function FilterSheet({
  pack,
  filters,
  onChange,
  onClose,
}: {
  pack: IndustryPack;
  filters: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
  onClose: () => void;
}) {
  const types = availablePropertyTypes(pack);
  const bedroomCounts = availableBedroomCounts(pack);
  const locations = availableLocations(pack);
  const featureKeys = availableFeatureKeys(pack);
  const bounds = priceBounds(pack);
  const showStatus = hasAnyAvailabilityData(pack);

  const priceQuestion: Question = {
    id: "price",
    label: "Price",
    prompt: "",
    type: "budget",
    section: "",
    min: bounds?.min ?? 0,
    max: bounds?.max ?? 0,
    step: Math.max(1, Math.round(((bounds?.max ?? 0) - (bounds?.min ?? 0)) / 50)),
    unit: pack.currency,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="glass-strong max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-[1.8rem] p-5 ring-1 ring-white/10 sm:rounded-[1.8rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Filters</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          {types.length > 0 && (
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                Property type
              </div>
              <div className="flex flex-wrap gap-1.5">
                {types.map((t) => (
                  <Chip
                    key={t.id}
                    active={filters.propertyTypes.includes(t.id)}
                    onClick={() => onChange({ ...filters, propertyTypes: toggleIn(filters.propertyTypes, t.id) })}
                  >
                    {t.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {bedroomCounts.length > 0 && (
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Bedrooms</div>
              <div className="flex flex-wrap gap-1.5">
                {bedroomCounts.map((n) => (
                  <Chip
                    key={n}
                    active={filters.bedrooms.includes(n)}
                    onClick={() => onChange({ ...filters, bedrooms: toggleIn(filters.bedrooms, n) })}
                  >
                    {n === 0 ? "Studio" : n}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {bounds && bounds.max > bounds.min && (
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Price</div>
              <BudgetControl
                question={priceQuestion}
                value={filters.price ?? { min: bounds.min, max: bounds.max }}
                onChange={(v) => onChange({ ...filters, price: v })}
              />
            </div>
          )}

          {locations.length > 0 && (
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Location</div>
              <div className="flex flex-wrap gap-1.5">
                {locations.map((loc) => (
                  <Chip
                    key={loc}
                    active={filters.locations.includes(loc)}
                    onClick={() => onChange({ ...filters, locations: toggleIn(filters.locations, loc) })}
                  >
                    {loc}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {featureKeys.length > 0 && (
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Features</div>
              <div className="flex flex-wrap gap-1.5">
                {featureKeys.map((key) => (
                  <Chip
                    key={key}
                    active={filters.features.includes(key)}
                    onClick={() => onChange({ ...filters, features: toggleIn(filters.features, key) })}
                  >
                    {featureLabel(pack, key)}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {showStatus && (
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Status</div>
              <div className="flex flex-wrap gap-1.5">
                {(["Available", "Sold out"] as const).map((s) => (
                  <Chip
                    key={s}
                    active={filters.status === s}
                    onClick={() => onChange({ ...filters, status: filters.status === s ? null : s })}
                  >
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={() => onChange({ propertyTypes: [], bedrooms: [], price: null, locations: [], features: [], status: null })}
            disabled={!hasActiveFilters(filters)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-ink-muted transition hover:bg-white/10 disabled:opacity-40"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-brand py-2.5 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}

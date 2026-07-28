"use client";

import { useEffect, useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import {
  CURRENCIES,
  LANGUAGES,
  TIMEZONES,
  WEEKDAYS,
  getOrganization,
  saveOrganization,
  type Organization,
} from "@/core/data/organization";
import { Field, Select, TextArea, TextInput } from "@/components/console/builder/fields";

/**
 * Organization Management (Module 1). Edits the tenant profile, localization,
 * working hours and business units. Autosaves; the company name and logo glyph
 * flow live to the dashboard shell.
 */
export function OrganizationSettings() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setOrg(getOrganization());
  }, []);

  if (!org) return null;

  const update = (patch: Partial<Organization>) => {
    const next = { ...org, ...patch };
    setOrg(next);
    saveOrganization(next);
    setSavedFlash(true);
    window.clearTimeout((update as never as { _t?: number })._t);
    (update as never as { _t?: number })._t = window.setTimeout(
      () => setSavedFlash(false),
      1200,
    );
  };

  const toggleDay = (day: string) => {
    const days = org.workingHours.days.includes(day)
      ? org.workingHours.days.filter((d) => d !== day)
      : [...WEEKDAYS].filter((d) => org.workingHours.days.includes(d) || d === day);
    update({ workingHours: { ...org.workingHours, days } });
  };

  return (
    <div className="space-y-4">
      <Panel
        title="Organization profile"
        right={
          <span
            className={cx(
              "inline-flex items-center gap-1 text-xs transition-opacity",
              savedFlash ? "opacity-100 text-emerald-600" : "opacity-0",
            )}
          >
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        }
      >
        <div className="flex items-center gap-4 pb-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-zinc-900 text-2xl text-white">
            {org.logoGlyph || org.name.charAt(0)}
          </span>
          <div>
            <div className="text-lg font-semibold text-zinc-900">{org.name || "Untitled organization"}</div>
            <div className="text-sm text-zinc-400">{org.tagline}</div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-2">
          <Field label="Company name">
            <TextInput value={org.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Legal name">
            <TextInput value={org.legalName} onChange={(e) => update({ legalName: e.target.value })} />
          </Field>
          <Field label="Logo glyph" hint="A character or emoji used as the mark">
            <TextInput value={org.logoGlyph} maxLength={2} onChange={(e) => update({ logoGlyph: e.target.value })} />
          </Field>
          <Field label="Logo URL" hint="Optional image (falls back to the glyph)">
            <TextInput value={org.logoUrl} placeholder="https://…" onChange={(e) => update({ logoUrl: e.target.value })} />
          </Field>
          <Field label="Tagline" className="sm:col-span-2">
            <TextInput value={org.tagline} onChange={(e) => update({ tagline: e.target.value })} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <TextArea rows={2} value={org.address} onChange={(e) => update({ address: e.target.value })} />
          </Field>
        </div>
      </Panel>

      <Panel title="Localization & defaults">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Default language">
            <Select value={org.defaultLanguage} onChange={(e) => update({ defaultLanguage: e.target.value })}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Default currency">
            <Select value={org.defaultCurrency} onChange={(e) => update({ defaultCurrency: e.target.value })}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Timezone">
            <Select value={org.timezone} onChange={(e) => update({ timezone: e.target.value })}>
              {TIMEZONES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>

      <Panel title="Working hours">
        <div className="flex flex-wrap gap-1.5 pb-4">
          {WEEKDAYS.map((day) => {
            const on = org.workingHours.days.includes(day);
            return (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  on ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-2">
          <Field label="Opens">
            <TextInput
              type="time"
              value={org.workingHours.open}
              onChange={(e) => update({ workingHours: { ...org.workingHours, open: e.target.value } })}
            />
          </Field>
          <Field label="Closes">
            <TextInput
              type="time"
              value={org.workingHours.close}
              onChange={(e) => update({ workingHours: { ...org.workingHours, close: e.target.value } })}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Business units">
        <BusinessUnits units={org.businessUnits} onChange={(businessUnits) => update({ businessUnits })} />
      </Panel>
    </div>
  );
}

function BusinessUnits({
  units,
  onChange,
}: {
  units: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {units.map((u, i) => (
        <div key={i} className="flex items-center gap-2">
          <TextInput
            value={u}
            onChange={(e) => onChange(units.map((x, idx) => (idx === i ? e.target.value : x)))}
            className="flex-1"
          />
          <button
            onClick={() => onChange(units.filter((_, idx) => idx !== i))}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-rose-600"
            aria-label="Remove business unit"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...units, ""])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50"
      >
        <Plus className="h-4 w-4" /> Add business unit
      </button>
    </div>
  );
}

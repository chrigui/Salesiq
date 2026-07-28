"use client";

import { useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  MapPin,
  Users,
  MonitorSmartphone,
  Smartphone,
} from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { WEEKDAYS } from "@/core/data/organization";
import {
  getBranches,
  newBranch,
  saveBranches,
  useBranches,
  type Branch,
} from "@/core/data/branches";
import { Field, NumberInput, Select, TextInput } from "@/components/console/builder/fields";

/**
 * Branch Management (Module 1). Each company can create unlimited branches;
 * each branch carries its own address/GPS, working hours, and — once those
 * modules land — its own team, inventory, displays and companions. For now the
 * device/team counts are editable placeholders that those modules will wire
 * up live.
 */
export function BranchManagement() {
  const branches = useBranches();
  const [openId, setOpenId] = useState<string | null>(null);

  const commit = (next: Branch[]) => saveBranches(next);
  const update = (id: string, patch: Partial<Branch>) =>
    commit(branches.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id: string) => {
    if (!confirm("Remove this branch? This cannot be undone.")) return;
    commit(branches.filter((b) => b.id !== id));
  };
  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= branches.length) return;
    const next = [...branches];
    [next[index], next[to]] = [next[to], next[index]];
    commit(next);
  };
  const add = () => {
    const b = newBranch();
    commit([...getBranches(), b]);
    setOpenId(b.id);
  };

  const activeCount = branches.filter((b) => b.status === "active").length;
  const totals = branches.reduce(
    (acc, b) => ({
      team: acc.team + b.teamSize,
      displays: acc.displays + b.displays,
      companions: acc.companions + b.companions,
    }),
    { team: 0, displays: 0, companions: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={MapPin} label="Branches" value={`${activeCount} / ${branches.length}`} sub="active of total" />
        <SummaryCard icon={Users} label="Team across branches" value={String(totals.team)} sub="people" />
        <SummaryCard icon={MonitorSmartphone} label="Devices deployed" value={`${totals.displays + totals.companions}`} sub={`${totals.displays} displays · ${totals.companions} companions`} />
      </div>

      <Panel
        title="Branches"
        right={
          <button
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Add branch
          </button>
        }
      >
        <div className="space-y-2">
          {branches.map((b, i) => (
            <BranchRow
              key={b.id}
              branch={b}
              index={i}
              total={branches.length}
              open={openId === b.id}
              onToggle={() => setOpenId(openId === b.id ? null : b.id)}
              onChange={(patch) => update(b.id, patch)}
              onRemove={() => remove(b.id)}
              onMove={(dir) => move(i, dir)}
            />
          ))}
          {branches.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
              No branches yet. Add one to start assigning teams and devices.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-zinc-400">{sub}</div>
    </div>
  );
}

function BranchRow({
  branch: b,
  index,
  total,
  open,
  onToggle,
  onChange,
  onRemove,
  onMove,
}: {
  branch: Branch;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Branch>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const toggleDay = (day: string) => {
    const days = b.workingHours.days.includes(day)
      ? b.workingHours.days.filter((d) => d !== day)
      : [...WEEKDAYS].filter((d) => b.workingHours.days.includes(d) || d === day);
    onChange({ workingHours: { ...b.workingHours, days } });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span
          className={cx(
            "h-2 w-2 shrink-0 rounded-full",
            b.status === "active" ? "bg-emerald-500" : "bg-zinc-300",
          )}
        />
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <span className="text-sm font-medium text-zinc-900">{b.name || "Untitled branch"}</span>
          {b.code && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
              {b.code}
            </span>
          )}
          <span className="text-xs text-zinc-400">{b.address || "No address set"}</span>
        </button>
        <div className="flex items-center gap-0.5">
          <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Delete" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
          <button
            onClick={onToggle}
            className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100"
          >
            <ChevronDown className={cx("h-4 w-4 transition", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-zinc-100 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Branch name">
              <TextInput value={b.name} onChange={(e) => onChange({ name: e.target.value })} />
            </Field>
            <Field label="Code" hint="Short internal code">
              <TextInput
                value={b.code}
                maxLength={5}
                onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={b.status}
                onChange={(e) => onChange({ status: e.target.value as Branch["status"] })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Address">
              <TextInput value={b.address} onChange={(e) => onChange({ address: e.target.value })} />
            </Field>
            <Field label="Phone">
              <TextInput value={b.phone} onChange={(e) => onChange({ phone: e.target.value })} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Latitude" hint="GPS location for map placement">
              <NumberInput value={b.lat} step={0.0001} onValue={(lat) => onChange({ lat })} />
            </Field>
            <Field label="Longitude">
              <NumberInput value={b.lng} step={0.0001} onValue={(lng) => onChange({ lng })} />
            </Field>
          </div>

          <Field label="Working hours">
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const on = b.workingHours.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cx(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                      on ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <TextInput
                type="time"
                value={b.workingHours.open}
                onChange={(e) => onChange({ workingHours: { ...b.workingHours, open: e.target.value } })}
              />
              <TextInput
                type="time"
                value={b.workingHours.close}
                onChange={(e) => onChange({ workingHours: { ...b.workingHours, close: e.target.value } })}
              />
            </div>
          </Field>

          <div className="grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-3">
            <Field label="Sales team" hint="People assigned to this branch">
              <NumberInput value={b.teamSize} min={0} onValue={(teamSize) => onChange({ teamSize: teamSize ?? 0 })} />
            </Field>
            <Field label="Displays">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="h-4 w-4 shrink-0 text-zinc-400" />
                <NumberInput value={b.displays} min={0} onValue={(displays) => onChange({ displays: displays ?? 0 })} />
              </div>
            </Field>
            <Field label="Companions">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 shrink-0 text-zinc-400" />
                <NumberInput value={b.companions} min={0} onValue={(companions) => onChange({ companions: companions ?? 0 })} />
              </div>
            </Field>
          </div>
        </div>
      )}
    </div>
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
      className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

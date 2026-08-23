"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Mail, Phone, Plus, Trash2, Users } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { SegmentBuilder } from "@/components/console/builder/SegmentBuilder";
import { SEGMENT_FIELD_INFO, type BuyerSegmentCriterion } from "@/core/buyerIntelligence/segments";
import {
  useBuyerSegments,
  useSegmentBuyers,
  createBuyerSegment,
  updateBuyerSegment,
  deleteBuyerSegment,
  type BuyerSegment,
} from "@/core/store/buyerProfiles";

function criterionSummary(c: BuyerSegmentCriterion): string {
  return `${SEGMENT_FIELD_INFO[c.field].label}: ${c.value}`;
}

/**
 * Wave 2 Buyer Segmentation — a segment is a saved filter, never a stored
 * membership list, so the count shown here is always live (see
 * compileSegmentWhere). Mirrors the Buyers list's card styling; each
 * segment expands into its own criteria editor and drill-in buyer list.
 */
export function BuyerSegments({ onOpenBuyer }: { onOpenBuyer: (id: string) => void }) {
  const { segments, isLoading } = useBuyerSegments();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Panel
      title="Segments"
      right={
        !creating && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New segment
          </button>
        )
      }
    >
      {creating && <NewSegmentForm onDone={() => setCreating(false)} />}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : segments.length === 0 && !creating ? (
        <p className="py-6 text-center text-sm text-zinc-400">
          No segments yet. Create one to group buyers by intent, readiness stage, purpose, priorities, or ownership —
          membership always reflects current buyer state, never a stale snapshot.
        </p>
      ) : (
        <div className="space-y-2">
          {segments.map((s) => (
            <SegmentRow
              key={s.id}
              segment={s}
              open={openId === s.id}
              onToggle={() => setOpenId(openId === s.id ? null : s.id)}
              onOpenBuyer={onOpenBuyer}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

function NewSegmentForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [criteria, setCriteria] = useState<BuyerSegmentCriterion[]>([{ field: "intentLevel", value: "high" }]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || criteria.length === 0) return;
    setSaving(true);
    await createBuyerSegment(name.trim(), criteria);
    setSaving(false);
    onDone();
  };

  return (
    <div className="mb-3 space-y-3 rounded-2xl border border-zinc-200 p-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Segment name, e.g. High intent, Evaluating stage"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
      />
      <SegmentBuilder criteria={criteria} onChange={setCriteria} />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving || !name.trim() || criteria.length === 0}
          className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save segment"}
        </button>
        <button onClick={onDone} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

function SegmentRow({
  segment,
  open,
  onToggle,
  onOpenBuyer,
}: {
  segment: BuyerSegment;
  open: boolean;
  onToggle: () => void;
  onOpenBuyer: (id: string) => void;
}) {
  const [criteria, setCriteria] = useState<BuyerSegmentCriterion[]>(segment.criteria);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(criteria) !== JSON.stringify(segment.criteria);
  const { buyerProfiles, isLoading } = useSegmentBuyers(open ? segment.id : null);

  const saveCriteria = async () => {
    setSaving(true);
    await updateBuyerSegment(segment.id, { criteria });
    setSaving(false);
  };

  const remove = async () => {
    await deleteBuyerSegment(segment.id);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Users className="h-4 w-4 shrink-0 text-zinc-400" />
        <button onClick={onToggle} className="flex flex-1 flex-wrap items-center gap-2 text-left">
          <span className="text-sm font-medium text-zinc-900">{segment.name}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            {segment.buyerCount} buyer{segment.buyerCount === 1 ? "" : "s"}
          </span>
          {segment.criteria.map((c, i) => (
            <span key={i} className="rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-500">
              {criterionSummary(c)}
            </span>
          ))}
        </button>
        <button
          aria-label="Delete segment"
          onClick={remove}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={onToggle} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100">
          <ChevronDown className={cx("h-4 w-4 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-zinc-100 px-4 py-4">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Criteria</p>
            <SegmentBuilder criteria={criteria} onChange={setCriteria} />
            {dirty && (
              <button
                onClick={saveCriteria}
                disabled={saving}
                className="mt-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            )}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Matching buyers</p>
            {isLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : buyerProfiles.length === 0 ? (
              <p className="text-sm text-zinc-400">No buyers currently match this segment.</p>
            ) : (
              <div className="space-y-2">
                {buyerProfiles.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onOpenBuyer(b.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-500">
                      {b.name.slice(0, 1).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-zinc-900">{b.name || "Unnamed buyer"}</div>
                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-zinc-400">
                        {b.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {b.email}
                          </span>
                        )}
                        {b.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {b.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

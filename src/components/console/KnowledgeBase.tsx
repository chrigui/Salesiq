"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2, BookOpen } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import {
  KNOWLEDGE_CATEGORIES,
  createEntry,
  deleteEntry,
  updateEntry,
  useKnowledgeBase,
  type KnowledgeEntry,
} from "@/core/data/knowledgeBase";
import { Field, Select, TextArea, TextInput } from "@/components/console/builder/fields";

/**
 * Knowledge Base (Module 6). Tenant-authored facts that ground the AI
 * features — Proposal Writer, Email Generator, Objection Handler — below
 * the deterministic scoring layer. Entries are sent to those API routes
 * alongside the verified item facts; the AI is told to use them and nothing
 * beyond them.
 */
export function KnowledgeBase() {
  const entries = useKnowledgeBase();
  const [openId, setOpenId] = useState<string | null>(null);

  const add = () => {
    const entry = createEntry({
      title: "New entry",
      category: "General",
      content: "",
    });
    setOpenId(entry.id);
  };

  return (
    <div className="space-y-4">
      <Panel
        title="Knowledge base"
        right={
          <button
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Add entry
          </button>
        }
      >
        <p className="mb-4 text-sm text-zinc-500">
          Facts the AI can draw on — financing terms, policies, warranty
          details — for proposals, follow-up emails and objection responses.
          It&rsquo;s told to use these facts only, never invent beyond them.
        </p>

        <div className="space-y-2">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              open={openId === entry.id}
              onToggle={() => setOpenId(openId === entry.id ? null : entry.id)}
              onDelete={() => {
                if (confirm(`Delete "${entry.title}"?`)) deleteEntry(entry.id);
              }}
            />
          ))}
          {entries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
              <BookOpen className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
              No knowledge yet. Add facts the AI should know about your
              business.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function EntryRow({
  entry,
  open,
  onToggle,
  onDelete,
}: {
  entry: KnowledgeEntry;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const patch = (p: Partial<KnowledgeEntry>) => updateEntry(entry.id, p);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <span className="text-sm font-medium text-zinc-900">{entry.title || "Untitled"}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
            {entry.category}
          </span>
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete entry"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onToggle}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100"
        >
          <ChevronDown className={cx("h-4 w-4 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-100 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <TextInput value={entry.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <Field label="Category">
              <Select value={entry.category} onChange={(e) => patch({ category: e.target.value })}>
                {KNOWLEDGE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Content" hint="Plain facts — the AI quotes these directly">
            <TextArea rows={3} value={entry.content} onChange={(e) => patch({ content: e.target.value })} />
          </Field>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

/**
 * Knowledge Base (Module 6 · AI Engine) — "private AI knowledge."
 *
 * Tenant-authored facts (financing terms, policies, warranty details, local
 * regulations…) that ground the AI features below the deterministic scoring
 * layer: Proposal Writer, Email Generator and the Objection Handler. Stored
 * client-side like every other Platform Foundation resource; since the API
 * routes are stateless serverless functions with no access to the browser's
 * storage, the client sends the relevant entries in the request body
 * alongside the verified item facts — the same honest pattern already used
 * for session answers. The AI is always told to use these facts only,
 * never invent beyond them.
 */
export interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export const KNOWLEDGE_CATEGORIES = [
  "Financing",
  "Policies",
  "Warranty",
  "Process",
  "General",
] as const;

const KEY = "salesiq-knowledge-base";
const EVT = "salesiq-knowledge-updated";

const now = Date.now();
const DEFAULTS: KnowledgeEntry[] = [
  {
    id: "kb-financing",
    title: "Financing options",
    category: "Financing",
    content:
      "We offer in-house financing from 10% down with partner banks, typical terms of 15-25 years at competitive rates. Pre-approval takes 48 hours.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "kb-deposit",
    title: "Reservation deposit",
    category: "Process",
    content:
      "A refundable 5% reservation deposit holds any listed item for 14 days while paperwork and financing are finalized.",
    createdAt: now,
    updatedAt: now,
  },
];

export function getKnowledgeBase(): KnowledgeEntry[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return JSON.parse(raw) as KnowledgeEntry[];
  } catch {
    return DEFAULTS;
  }
}

function saveAll(entries: KnowledgeEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function createEntry(input: {
  title: string;
  category: string;
  content: string;
}): KnowledgeEntry {
  const entry: KnowledgeEntry = {
    ...input,
    id: `kb-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveAll([entry, ...getKnowledgeBase()]);
  return entry;
}

export function updateEntry(id: string, patch: Partial<KnowledgeEntry>): void {
  saveAll(
    getKnowledgeBase().map((e) =>
      e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e,
    ),
  );
}

export function deleteEntry(id: string): void {
  saveAll(getKnowledgeBase().filter((e) => e.id !== id));
}

/** Live knowledge base — reacts to edits across tabs and in-tab. */
export function useKnowledgeBase(): KnowledgeEntry[] {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  useEffect(() => {
    const load = () => setEntries(getKnowledgeBase());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return entries;
}

/** The compact {title, content} shape sent to AI routes — category dropped
 * since it's an authoring aid, not something the model needs. */
export function knowledgePayload(
  entries: KnowledgeEntry[],
): { title: string; content: string }[] {
  return entries.map((e) => ({ title: e.title, content: e.content }));
}

"use client";

import { useEffect, useState } from "react";
import { getBasePack, PACKS } from "@/core/industries";
import { compileRules } from "@/core/industries/rules";
import type {
  Branding,
  InventoryItem,
  IndustryPack,
  Question,
  RuleSpec,
} from "@/core/types";

/**
 * Tenant pack customisation — the storage behind the Visual Builder.
 *
 * The Company Dashboard lets an admin edit a pack's questions and inventory
 * without touching code. Those edits are stored here as a per-pack *draft* that
 * overlays the shipped config. Every surface that renders a pack (companion,
 * display) reads the merged result through `useLivePack`, so a change made in
 * the dashboard shows up live on the other screens — the same localStorage +
 * event pattern used for leads.
 *
 * In production this becomes a row in the tenant's pack table; the shape (a
 * questions array + an inventory array over the base pack) stays identical.
 */
export interface PackDraft {
  questions?: Question[];
  inventory?: InventoryItem[];
  ruleSpecs?: RuleSpec[];
  branding?: Branding;
  updatedAt: number;
}

const KEY = "salesiq-pack-drafts";
const EVT = "salesiq-packs-updated";

type DraftMap = Record<string, PackDraft>;

function readAll(): DraftMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as DraftMap;
  } catch {
    return {};
  }
}

function writeAll(map: DraftMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function getDraft(packId: string): PackDraft | undefined {
  return readAll()[packId];
}

export function hasDraft(packId: string): boolean {
  const d = readAll()[packId];
  return (
    !!d &&
    (d.questions != null ||
      d.inventory != null ||
      d.ruleSpecs != null ||
      d.branding != null)
  );
}

/** Overlay a draft onto its base pack. Missing sections fall back to the base. */
export function mergePack(base: IndustryPack, draft?: PackDraft): IndustryPack {
  if (!draft) return base;
  const ruleSpecs = draft.ruleSpecs ?? base.ruleSpecs;
  return {
    ...base,
    questions: draft.questions ?? base.questions,
    inventory: draft.inventory ?? base.inventory,
    branding: draft.branding ?? base.branding,
    ruleSpecs,
    // Recompile rules whenever the draft overrides the specs.
    rules: draft.ruleSpecs ? compileRules(draft.ruleSpecs) : base.rules,
  };
}

/** The current effective pack (base + draft) — what the builder edits against. */
export function getEffectivePack(packId: string): IndustryPack {
  const base = getBasePack(packId);
  return mergePack(base, getDraft(base.id));
}

function patchDraft(packId: string, patch: Partial<PackDraft>): void {
  const all = readAll();
  const base = getBasePack(packId);
  all[base.id] = { ...all[base.id], ...patch, updatedAt: Date.now() };
  writeAll(all);
}

export function saveQuestions(packId: string, questions: Question[]): void {
  patchDraft(packId, { questions });
}

export function saveInventory(packId: string, inventory: InventoryItem[]): void {
  patchDraft(packId, { inventory });
}

export function saveRuleSpecs(packId: string, ruleSpecs: RuleSpec[]): void {
  patchDraft(packId, { ruleSpecs });
}

export function saveBranding(packId: string, branding: Branding): void {
  patchDraft(packId, { branding });
}

/** Discard all customisations for a pack, reverting to the shipped config. */
export function resetPack(packId: string): void {
  const all = readAll();
  const base = getBasePack(packId);
  delete all[base.id];
  writeAll(all);
}

/**
 * Reactive merged pack. Re-renders when a draft changes — in this tab (custom
 * event) or another (storage event) — so builder edits propagate live to the
 * companion and display.
 */
export function useLivePack(packId: string): IndustryPack {
  const [pack, setPack] = useState<IndustryPack>(() => getBasePack(packId));
  useEffect(() => {
    const load = () => setPack(getEffectivePack(packId));
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, [packId]);
  return pack;
}

/** Which installed packs currently carry customisations (for the dashboard). */
export function useDraftedPackIds(): string[] {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const load = () =>
      setIds(PACKS.map((p) => p.id).filter((id) => hasDraft(id)));
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return ids;
}

/** Slug helper shared by the builder for generating ids from labels. */
export function slugify(input: string, fallback = "field"): string {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || fallback;
}

"use client";

import { useEffect, useState } from "react";
import type { Branding, IndustryPack } from "@/core/types";

/**
 * Industry Builder (Module 9) — "create new industries without code."
 *
 * A custom pack starts as a small shell (identity + branding + one default
 * section) with no questions, inventory or rules — the tenant fills those in
 * using the *same* Visual Builder screens already built for the shipped
 * packs (QuestionBuilder, InventoryBuilder, RulesBuilder, BrandingBuilder),
 * because those work against any pack id via the draft-overlay system in
 * core/store/packs.ts. This file only owns the shell's identity; the actual
 * content lives in that same draft store, identical to how a shipped pack's
 * customisations are stored.
 *
 * Same localStorage-backed seam as every other Platform Foundation resource;
 * in production this becomes a `packs` table row a tenant owns outright
 * (not an overlay on a shipped config).
 */
export interface CustomPackMeta {
  id: string;
  label: string;
  vertical: string;
  currency: string;
  branding: Branding;
  sections: { id: string; label: string }[];
  createdAt: number;
}

const KEY = "salesiq-custom-packs";
const EVT = "salesiq-custom-packs-updated";

export function getCustomPacks(): CustomPackMeta[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as CustomPackMeta[];
  } catch {
    return [];
  }
}

function saveAll(packs: CustomPackMeta[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(packs));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function getCustomPack(id: string): CustomPackMeta | undefined {
  return getCustomPacks().find((p) => p.id === id);
}

export interface CreatePackInput {
  label: string;
  vertical: string;
  currency: string;
  branding: Branding;
}

export function createCustomPack(input: CreatePackInput, existingIds: string[]): CustomPackMeta {
  const id = uniqueId(input.label, existingIds);
  const pack: CustomPackMeta = {
    id,
    label: input.label,
    vertical: input.vertical,
    currency: input.currency,
    branding: input.branding,
    sections: [{ id: "general", label: "General" }],
    createdAt: Date.now(),
  };
  saveAll([...getCustomPacks(), pack]);
  return pack;
}

export function deleteCustomPack(id: string): void {
  saveAll(getCustomPacks().filter((p) => p.id !== id));
}

function uniqueId(label: string, existingIds: string[]): string {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "industry";
  if (!existingIds.includes(base)) return base;
  let n = 2;
  while (existingIds.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Turn a shell's identity into a full (empty) IndustryPack the rest of the
 * app can render — the Visual Builder's draft overlay fills it in from here. */
export function customPackToShell(meta: CustomPackMeta): IndustryPack {
  return {
    id: meta.id,
    label: meta.label,
    vertical: meta.vertical,
    currency: meta.currency,
    branding: meta.branding,
    sections: meta.sections,
    questions: [],
    inventory: [],
    rules: [],
    ruleSpecs: [],
  };
}

/** Live custom-pack list — reacts to creates/deletes across tabs and in-tab. */
export function useCustomPacks(): CustomPackMeta[] {
  const [packs, setPacks] = useState<CustomPackMeta[]>([]);
  useEffect(() => {
    const load = () => setPacks(getCustomPacks());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return packs;
}

import type { IndustryPack } from "@/core/types";
import { realEstatePack } from "./real-estate";
import { bahrainRealEstatePack } from "./real-estate-bahrain";
import { automotivePack } from "./automotive";
import { privateJetsPack } from "./private-jets";
import { yachtPack } from "./yacht";

/**
 * The registry of installed industry packs. In production each tenant selects
 * (or authors) a pack; here we ship five to demonstrate that the platform is
 * genuinely industry-agnostic — the same engine and UI power all of them.
 * Tenants can add more of their own from the dashboard's Industry Builder
 * with no code at all — see core/data/customPacks.ts.
 */
export const PACKS: IndustryPack[] = [
  realEstatePack,
  bahrainRealEstatePack,
  automotivePack,
  privateJetsPack,
  yachtPack,
];

export const PACKS_BY_ID: Record<string, IndustryPack> = Object.fromEntries(
  PACKS.map((p) => [p.id, p]),
);

export const DEFAULT_PACK_ID = realEstatePack.id;

/**
 * The shipped pack config, ignoring any tenant customisation. Used by the
 * engine, the API routes, and as the base the Visual Builder overlays drafts
 * onto (see `@/core/store/packs`).
 */
export function getBasePack(id: string | null | undefined): IndustryPack {
  if (id && PACKS_BY_ID[id]) return PACKS_BY_ID[id];
  return PACKS_BY_ID[DEFAULT_PACK_ID];
}

/** Alias kept for existing call sites; identical to `getBasePack`. */
export const getPack = getBasePack;

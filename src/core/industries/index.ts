import type { IndustryPack } from "@/core/types";
import { realEstatePack } from "./real-estate";
import { automotivePack } from "./automotive";
import { privateJetsPack } from "./private-jets";

/**
 * The registry of installed industry packs. In production each tenant selects
 * (or authors) a pack; here we ship three to demonstrate that the platform is
 * genuinely industry-agnostic — the same engine and UI power all of them.
 */
export const PACKS: IndustryPack[] = [
  realEstatePack,
  automotivePack,
  privateJetsPack,
];

export const PACKS_BY_ID: Record<string, IndustryPack> = Object.fromEntries(
  PACKS.map((p) => [p.id, p]),
);

export const DEFAULT_PACK_ID = realEstatePack.id;

export function getPack(id: string | null | undefined): IndustryPack {
  if (id && PACKS_BY_ID[id]) return PACKS_BY_ID[id];
  return PACKS_BY_ID[DEFAULT_PACK_ID];
}

/**
 * Shared derivation of the real commute/location-preference scoring options
 * (see ScoreInventoryOptions in src/core/engine/scoring.ts) from session
 * answers. Used by both DiscoveryWizard's own scoreInventory call and
 * CompanionApp's workspace call so the match count a salesperson sees during
 * discovery is the same number they see after finishing — one derivation,
 * two call sites, per the approved LUMMA Round 2 plan.
 */
import { useMemo } from "react";
import type { Answers, IndustryPack, NearbyAmenity } from "@/core/types";
import { scoreInventory, type ScoredItem, type ScoreInventoryOptions } from "@/core/engine/scoring";
import { useSession } from "@/core/store/session";
import { useBuyerProfile, useBuyerRejectedItems } from "@/core/store/buyerProfiles";
import { toPriorityWeights } from "@/core/buyerIntelligence/priorityWeights";

/** ~35 km/h average — the standard real-estate "X min commute" assumption,
 * same convention as the existing "~4.8 km/h walk" one in LifestyleEditor.tsx.
 * Applied to a real geocoded distance, never a fabricated one. */
const AVG_COMMUTE_KMH = 35;
const COMMUTE_WEIGHT: Record<string, number> = { veryImportant: 3, important: 2, flexible: 0.75 };
const LOCATION_WEIGHT: Record<string, number> = {
  essential: 3,
  important: 2,
  niceToHave: 1,
  notImportant: 0.3,
};
/** Only kinds with a real counterpart in OpenStreetMap-fetched nearbyAmenities are scored. */
const AMENITY_KIND_MAP: Record<string, NearbyAmenity["kind"]> = {
  schools: "school",
  hospitals: "hospital",
  supermarkets: "supermarket",
  restaurants: "restaurant",
  publicTransport: "transport",
};

export const COMMUTE_IMPORTANCE_LABEL: Record<string, string> = {
  veryImportant: "Very important",
  important: "Important",
  flexible: "Flexible",
};

/** Converts a real distance (haversineMeters, or a real nearbyAmenities
 * distanceMeters) into an estimated minutes figure — the same
 * AVG_COMMUTE_KMH convention deriveCommuteOption uses, reused here rather
 * than introducing a second speed assumption for amenity distances. */
export function metersToMinutes(distanceMeters: number): number {
  const km = distanceMeters / 1000;
  return Math.round((km / AVG_COMMUTE_KMH) * 60);
}

/** Real commute fit: only built once we have a geocoded point, a stated
 * importance, and a real (non-"no preference") maximum — never fabricated. */
export function deriveCommuteOption(
  answers: Answers,
  workLocationLat: number | null,
  workLocationLng: number | null,
): { lat: number; lng: number; maxKm: number; weight: number } | undefined {
  const importance = answers.commuteImportance;
  const maxCommute = answers.maxCommute;
  if (
    workLocationLat == null ||
    workLocationLng == null ||
    typeof maxCommute !== "string" ||
    maxCommute === "noPreference"
  ) {
    return undefined;
  }
  const minutes = maxCommute === "60plus" ? 75 : Number(maxCommute);
  if (!Number.isFinite(minutes)) return undefined;
  const maxKm = (minutes / 60) * AVG_COMMUTE_KMH;
  const weight =
    (typeof importance === "string" && COMMUTE_IMPORTANCE_LABEL[importance] && COMMUTE_WEIGHT[importance]) || 1.5;
  return { lat: workLocationLat, lng: workLocationLng, maxKm, weight };
}

/** Real "what's nearby" fit: only for kinds the app can actually verify
 * against a property's real, OpenStreetMap-fetched nearbyAmenities. */
export function deriveLocationPreferencesOption(
  answers: Answers,
): { kinds: NearbyAmenity["kind"][]; weight: number } | undefined {
  const selected = answers.nearbyPreferences;
  if (!Array.isArray(selected) || selected.length === 0) return undefined;
  const kinds = selected
    .map((s) => AMENITY_KIND_MAP[s as string])
    .filter((k): k is NearbyAmenity["kind"] => Boolean(k));
  if (kinds.length === 0) return undefined;
  const importance = answers.locationImportance;
  const weight = (typeof importance === "string" && LOCATION_WEIGHT[importance]) || 1.5;
  return { kinds, weight };
}

/**
 * The exact same scoreInventory options bundle CompanionApp's workspace
 * already assembles (priority weights from a linked buyer's stated
 * priorities, rejected-item exclusion, real commute/location-preference
 * fit) — extracted here so a third call site (the Property Explorer) never
 * has to re-derive it slightly differently and drift out of sync with what
 * the salesperson already saw during discovery/confirmation.
 */
export function useScoreOptions(pack: IndustryPack): ScoreInventoryOptions {
  const session = useSession();
  const { buyerProfile } = useBuyerProfile(session.buyerProfileId);
  const priorityWeights = useMemo(
    () => toPriorityWeights(buyerProfile?.priorities ?? null),
    [buyerProfile?.priorities],
  );
  const { rejectedItems } = useBuyerRejectedItems(session.buyerProfileId);
  const excludeItemIds = useMemo(
    () =>
      rejectedItems
        .filter((r) => r.packId === pack.id && !r.overriddenAt)
        .map((r) => r.itemId),
    [rejectedItems, pack.id],
  );
  const commuteOption = useMemo(
    () => deriveCommuteOption(session.answers, session.workLocationLat, session.workLocationLng),
    [session.answers, session.workLocationLat, session.workLocationLng],
  );
  const locationPreferencesOption = useMemo(
    () => deriveLocationPreferencesOption(session.answers),
    [session.answers],
  );
  return useMemo(
    () => ({
      priorityWeights,
      excludeItemIds,
      commute: commuteOption,
      locationPreferences: locationPreferencesOption,
    }),
    [priorityWeights, excludeItemIds, commuteOption, locationPreferencesOption],
  );
}

export function useScoredInventory(pack: IndustryPack): ScoredItem[] {
  const session = useSession();
  const opts = useScoreOptions(pack);
  return useMemo(() => scoreInventory(pack, session.answers, opts), [pack, session.answers, opts]);
}

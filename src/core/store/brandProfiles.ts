"use client";

import useSWR, { mutate as globalMutate } from "swr";

export interface BrandProfile {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  brand: string | null;
  brandSoft: string | null;
  logoGlyph: string | null;
  logoMimeType: string | null;
  fontHeading: string | null;
  fontBody: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  cardStyle: string;
  buttonStyle: string;
  borderRadius: string;
  shadowIntensity: string;
  spacingScale: string;
  defaultMotionPreset: string | null;
  isDefault: boolean;
}

const KEY = "/api/brand-profiles";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** The tenant's reusable brand kits — build once ("Green Hills Luxury"), attach to many Display Studio profiles. */
export function useBrandProfiles(): { brandProfiles: BrandProfile[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ brandProfiles: BrandProfile[] }>(KEY, fetcher);
  return { brandProfiles: data?.brandProfiles ?? [], isLoading: isLoading && data === undefined };
}

export async function createBrandProfile(input: {
  name: string;
  brand?: string;
  brandSoft?: string;
  logoGlyph?: string;
}): Promise<BrandProfile | null> {
  const res = await fetch(KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const { brandProfile } = await res.json();
  globalMutate(KEY);
  return brandProfile as BrandProfile;
}

export async function updateBrandProfile(
  id: string,
  patch: Partial<
    Pick<
      BrandProfile,
      | "name"
      | "brand"
      | "brandSoft"
      | "logoGlyph"
      | "fontHeading"
      | "fontBody"
      | "backgroundColor"
      | "textColor"
      | "cardStyle"
      | "buttonStyle"
      | "borderRadius"
      | "shadowIntensity"
      | "spacingScale"
      | "defaultMotionPreset"
    >
  > & { logoDataBase64?: string; logoMimeType?: string; removeLogo?: boolean; setDefault?: boolean },
): Promise<BrandProfile | null> {
  const res = await fetch(`${KEY}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  globalMutate(KEY);
  if (!res.ok) return null;
  const { brandProfile } = await res.json();
  return brandProfile as BrandProfile;
}

/**
 * The whole-Display default brand kit (Theme-PR3) — polled the same way
 * displayDevice.ts polls its own config, so a "Set as default" change in
 * the admin console reaches an already-open kiosk without a reload. Public
 * route (no auth) — the live Display has no login of its own, same as
 * every other Display-facing resolver.
 */
export function useDefaultBrandProfile(): BrandProfile | null {
  const { data } = useSWR<{ brandProfile: BrandProfile | null }>(
    "/api/public/brand-profiles/default",
    fetcher,
    { refreshInterval: 30_000 },
  );
  return data?.brandProfile ?? null;
}

export async function deleteBrandProfile(id: string): Promise<boolean> {
  const res = await fetch(`${KEY}/${id}`, { method: "DELETE" });
  globalMutate(KEY);
  return res.ok;
}

"use client";

import useSWR, { mutate as globalMutate } from "swr";

export type DisplayStatus = "Pending" | "Active" | "Archived";
export type DisplayDefaultExperience = "Welcome" | "PropertyHero" | "CustomIntro";

export interface Display {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  branchId: string | null;
  pairingCode: string;
  claimed: boolean;
  idleProfileId: string | null;
  liveProfileId: string | null;
  defaultExperience: DisplayDefaultExperience;
  status: DisplayStatus;
  lastSeenAt: number | null;
  online: boolean;
}

const DISPLAYS_KEY = "/api/displays";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** Live-updating list of the tenant's registered Displays — polled every 20s so the online/offline pill stays roughly current without a manual refresh. */
export function useDisplays(): { displays: Display[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ displays: Display[] }>(DISPLAYS_KEY, fetcher, {
    refreshInterval: 20_000,
  });
  return { displays: data?.displays ?? [], isLoading: isLoading && data === undefined };
}

export async function createDisplay(input: { name: string; branchId?: string }): Promise<Display | null> {
  const res = await fetch(DISPLAYS_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const { display } = await res.json();
  globalMutate(DISPLAYS_KEY);
  return display as Display;
}

export async function updateDisplay(
  id: string,
  patch: Partial<Pick<Display, "name" | "branchId" | "idleProfileId" | "liveProfileId" | "defaultExperience" | "status">>,
): Promise<Display | null> {
  const res = await fetch(`${DISPLAYS_KEY}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  globalMutate(DISPLAYS_KEY);
  if (!res.ok) return null;
  const { display } = await res.json();
  return display as Display;
}

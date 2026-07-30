"use client";

import useSWR, { mutate as globalMutate } from "swr";

/**
 * User records — Module 1 · Platform Foundation.
 *
 * Real DB-backed store (see src/app/api/users/*.ts) — this is the client
 * seam. `AppUser`, `UserRole`, `UserStatus` and `ROLES` keep their exact
 * shapes from the localStorage era; every read/write call site outside this
 * file needed only its own async handling, not a shape change.
 */
export type UserRole = "Owner" | "Admin" | "Manager" | "Salesperson" | "Viewer";
export type UserStatus = "active" | "invited" | "suspended";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  status: UserStatus;
  mfaEnabled: boolean;
  lastLogin: number | null;
  createdAt: number;
  device: string | null;
}

export const ROLES: UserRole[] = ["Owner", "Admin", "Manager", "Salesperson", "Viewer"];

const USERS_KEY = "/api/users";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** Live user list — reacts to edits across tabs and in-tab via SWR's shared cache. */
export function useUsers(): AppUser[] {
  const { data } = useSWR<{ users: AppUser[] }>(USERS_KEY, fetcher);
  return data?.users ?? [];
}

export async function inviteUser(input: {
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}): Promise<AppUser | null> {
  const res = await fetch(USERS_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const { user } = await res.json();
  globalMutate(USERS_KEY);
  return user as AppUser;
}

export async function updateUser(id: string, patch: Partial<AppUser>): Promise<void> {
  await fetch(`${USERS_KEY}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  globalMutate(USERS_KEY);
}

export async function deleteUser(id: string): Promise<void> {
  await fetch(`${USERS_KEY}/${id}`, { method: "DELETE" });
  globalMutate(USERS_KEY);
}

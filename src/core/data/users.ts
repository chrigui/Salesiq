"use client";

import { useEffect, useState } from "react";

/**
 * User records — Module 1 · Platform Foundation.
 *
 * Manages the people inside a tenant organization. Roles are declared here as
 * plain strings (not yet permission-mapped) — the Role & Permission Engine
 * (next feature) attaches capabilities to each role. Invite/suspend are
 * modelled as status transitions rather than real email delivery, since there
 * is no mail provider wired up yet; the seam is the same localStorage-backed
 * store used by every other Platform Foundation resource.
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

const KEY = "salesiq-users";
const EVT = "salesiq-users-updated";

const now = Date.now();
const DEFAULTS: AppUser[] = [
  {
    id: "u-sara",
    name: "Sara Haddad",
    email: "sara@greenhills.example",
    role: "Owner",
    branchId: "br-larnaca",
    status: "active",
    mfaEnabled: true,
    lastLogin: now - 1000 * 60 * 12,
    createdAt: now - 1000 * 60 * 60 * 24 * 400,
    device: "iPhone 16 Pro · Companion",
  },
  {
    id: "u-marco",
    name: "Marco Ionescu",
    email: "marco@greenhills.example",
    role: "Manager",
    branchId: "br-limassol",
    status: "active",
    mfaEnabled: true,
    lastLogin: now - 1000 * 60 * 60 * 3,
    createdAt: now - 1000 * 60 * 60 * 24 * 220,
    device: "Samsung Tab S9 · Companion",
  },
  {
    id: "u-elif",
    name: "Elif Demir",
    email: "elif@greenhills.example",
    role: "Salesperson",
    branchId: "br-larnaca",
    status: "active",
    mfaEnabled: false,
    lastLogin: now - 1000 * 60 * 60 * 26,
    createdAt: now - 1000 * 60 * 60 * 24 * 95,
    device: "iPhone 15 · Companion",
  },
  {
    id: "u-noah",
    name: "Noah Petrides",
    email: "noah@greenhills.example",
    role: "Salesperson",
    branchId: "br-paphos",
    status: "invited",
    mfaEnabled: false,
    lastLogin: null,
    createdAt: now - 1000 * 60 * 60 * 24 * 2,
    device: null,
  },
  {
    id: "u-review",
    name: "External Auditor",
    email: "auditor@partner.example",
    role: "Viewer",
    branchId: null,
    status: "suspended",
    mfaEnabled: true,
    lastLogin: now - 1000 * 60 * 60 * 24 * 60,
    createdAt: now - 1000 * 60 * 60 * 24 * 300,
    device: null,
  },
];

export function getUsers(): AppUser[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return JSON.parse(raw) as AppUser[];
  } catch {
    return DEFAULTS;
  }
}

export function saveUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function inviteUser(input: { name: string; email: string; role: UserRole; branchId: string | null }): AppUser {
  const user: AppUser = {
    id: `u-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    email: input.email,
    role: input.role,
    branchId: input.branchId,
    status: "invited",
    mfaEnabled: false,
    lastLogin: null,
    createdAt: Date.now(),
    device: null,
  };
  saveUsers([...getUsers(), user]);
  return user;
}

/** Live user list — reacts to edits across tabs and in-tab. */
export function useUsers(): AppUser[] {
  const [users, setUsers] = useState<AppUser[]>([]);
  useEffect(() => {
    const load = () => setUsers(getUsers());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return users;
}

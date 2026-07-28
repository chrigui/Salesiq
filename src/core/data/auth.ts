"use client";

import { useEffect, useState } from "react";
import { getUsers, saveUsers, type AppUser, type UserRole } from "./users";

/**
 * Authentication — Module 1 · Platform Foundation.
 *
 * ⚠️ PILOT-MODE AUTH. There is no server, database, or secret store in this
 * environment, so this module cannot be — and does not pretend to be — real
 * authentication. It models the full session lifecycle (login, MFA challenge,
 * session persistence + expiry, logout, route protection) against the
 * existing User records, using a fixed, clearly-labelled demo credential
 * instead of a password hash. Suspended/invited users are correctly refused,
 * `lastLogin` is updated on real accounts, and every other module (dashboard
 * gating, the permission matrix) consumes the session exactly as it would a
 * real one.
 *
 * To make this production-real once infrastructure exists: replace
 * `verifyCredential`/`verifyMfaCode` with calls to a real auth provider
 * (NextAuth, Clerk, Supabase Auth, etc.) or your own bcrypt-backed API route,
 * and swap the localStorage session for an httpOnly cookie / JWT issued by
 * that provider. `AuthSession`, `login`, `logout`, and `useSession` are the
 * seam — nothing above this file needs to change.
 */

export const DEMO_PASSWORD = "demo1234";
export const DEMO_MFA_CODE = "000000";

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  issuedAt: number;
  expiresAt: number;
}

const KEY = "salesiq-session";
const EVT = "salesiq-session-updated";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export type LoginError =
  | "not-found"
  | "wrong-password"
  | "suspended"
  | "invited";

export type LoginResult =
  | { ok: true; needsMfa: false; session: AuthSession }
  | { ok: true; needsMfa: true; pendingUserId: string }
  | { ok: false; error: LoginError };

/** Step 1 — verify email + (demo) password, decide whether MFA is required. */
export function verifyCredential(email: string, password: string): LoginResult {
  const user = getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) return { ok: false, error: "not-found" };
  if (password !== DEMO_PASSWORD) return { ok: false, error: "wrong-password" };
  if (user.status === "suspended") return { ok: false, error: "suspended" };
  if (user.status === "invited") return { ok: false, error: "invited" };

  if (user.mfaEnabled) {
    return { ok: true, needsMfa: true, pendingUserId: user.id };
  }
  return { ok: true, needsMfa: false, session: establishSession(user) };
}

/** Step 2 (only when the account has MFA enabled) — verify the demo code. */
export function verifyMfaCode(
  userId: string,
  code: string,
): { ok: true; session: AuthSession } | { ok: false } {
  if (code !== DEMO_MFA_CODE) return { ok: false };
  const user = getUsers().find((u) => u.id === userId);
  if (!user) return { ok: false };
  return { ok: true, session: establishSession(user) };
}

function establishSession(user: AppUser): AuthSession {
  const now = Date.now();
  saveUsers(getUsers().map((u) => (u.id === user.id ? { ...u, lastLogin: now, status: "active" } : u)));
  const session: AuthSession = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  persist(session);
  return session;
}

function persist(session: AuthSession | null): void {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt < Date.now()) {
      persist(null);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function logout(): void {
  persist(null);
}

/** Live session — reacts to login/logout across tabs and in-tab, and expiry. */
export function useSession(): AuthSession | null {
  const [session, setSession] = useState<AuthSession | null>(null);
  useEffect(() => {
    const load = () => setSession(getSession());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    // Cheap periodic check so an expired session gets cleared without a reload.
    const interval = window.setInterval(load, 60_000);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
      window.clearInterval(interval);
    };
  }, []);
  return session;
}

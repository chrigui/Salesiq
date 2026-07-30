"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { UserRole } from "./users";

/**
 * Authentication — Module 1 · Platform Foundation.
 *
 * Real auth: bcrypt-hashed passwords, a signed httpOnly session cookie
 * issued by /api/auth/login (+ /mfa), verified server-side on every
 * protected request (see src/lib/auth/{jwt,server}.ts and
 * src/middleware.ts). MFA itself is still pilot-mode — see
 * DEMO_MFA_CODE below and the comment on the mfa route — but the
 * password/session half of this file is genuinely real now.
 *
 * This is the seam every other module in the app already consumed:
 * `AuthSession`, `verifyCredential`, `verifyMfaCode`, `logout`, and
 * `useSession` keep the exact names and shapes they always had — only
 * their bodies changed, from localStorage reads to fetch calls.
 */

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  issuedAt: number;
  expiresAt: number;
}

// Still shown on-screen as a hint (gated on SHOW_DEMO_LOGINS) — the
// password itself is now genuinely bcrypt-hashed and compared server-side.
export const DEMO_PASSWORD = "demo1234";
export const DEMO_MFA_CODE = "000000";

export type LoginError = "not-found" | "wrong-password" | "suspended" | "invited" | "network";

export type LoginResult =
  | { ok: true; needsMfa: false; session: AuthSession }
  | { ok: true; needsMfa: true }
  | { ok: false; error: LoginError };

export type MfaResult = { ok: true; session: AuthSession } | { ok: false };

const SESSION_KEY = "/api/auth/session";

async function postJson(url: string, body: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

/** Step 1 — verify email + password, decide whether MFA is required. */
export async function verifyCredential(email: string, password: string): Promise<LoginResult> {
  try {
    const { data } = await postJson("/api/auth/login", { email, password });
    if (!data.ok) return { ok: false, error: (data.error as LoginError) ?? "not-found" };
    if (data.needsMfa) return { ok: true, needsMfa: true };
    const session = data.session as AuthSession;
    globalMutate(SESSION_KEY, { session }, false);
    return { ok: true, needsMfa: false, session };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** Step 2 (only when the account has MFA enabled) — verify the demo code. */
export async function verifyMfaCode(code: string): Promise<MfaResult> {
  try {
    const { data } = await postJson("/api/auth/mfa", { code });
    if (!data.ok) return { ok: false };
    const session = data.session as AuthSession;
    globalMutate(SESSION_KEY, { session }, false);
    return { ok: true, session };
  } catch {
    return { ok: false };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    globalMutate(SESSION_KEY, { session: null }, false);
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

/** Live session with an explicit loading state — use this where a one-frame
 * flash of "signed out" during the initial fetch would be visible (e.g. the
 * dashboard's login gate). */
export function useSessionStatus(): { session: AuthSession | null; status: SessionStatus } {
  const { data, isLoading } = useSWR<{ session: AuthSession | null }>(SESSION_KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
  if (isLoading && data === undefined) return { session: null, status: "loading" };
  const session = data?.session ?? null;
  return { session, status: session ? "authenticated" : "unauthenticated" };
}

/** Live session — reacts to login/logout across tabs (SWR focus-revalidation + shared cache) and in-tab (shared cache key). */
export function useSession(): AuthSession | null {
  return useSessionStatus().session;
}

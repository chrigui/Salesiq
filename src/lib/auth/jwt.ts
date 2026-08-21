import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import type { JWTPayload } from "jose";

/**
 * Edge-safe session primitives — the ONLY module src/middleware.ts is
 * allowed to import. This file must never import Prisma (directly or
 * transitively) or anything from src/core/data/* — the edge runtime
 * middleware runs on doesn't support Node's Prisma client, and an
 * accidental import here breaks the edge build with an opaque error. See
 * src/lib/auth/server.ts for the Node-only, DB-backed authoritative check.
 */

export const SESSION_COOKIE = "salesiq_session";
export const MFA_COOKIE = "salesiq_mfa";
export const SESSION_TTL_S = 12 * 60 * 60; // 12h — matches the pilot's prior localStorage TTL
export const MFA_TTL_S = 5 * 60;

export type AppUserRole = "Owner" | "Admin" | "Manager" | "Designer" | "Salesperson" | "Viewer";

export interface SessionClaims extends JWTPayload {
  sid: string; // Session row id — enables server-side revocation
  uid: string;
  tid: string;
  role: AppUserRole;
  bid: string | null;
  name: string;
  email: string;
}

export interface MfaClaims extends JWTPayload {
  purpose: "mfa";
  uid: string;
  tid: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set — required to sign/verify session tokens.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(claims: Omit<SessionClaims, "iat" | "exp">): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_S}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify<SessionClaims>(token, secretKey());
    return payload;
  } catch {
    return null;
  }
}

export async function signMfaToken(claims: Omit<MfaClaims, "iat" | "exp" | "purpose">): Promise<string> {
  return new SignJWT({ ...claims, purpose: "mfa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MFA_TTL_S}s`)
    .sign(secretKey());
}

export async function verifyMfaToken(token: string): Promise<MfaClaims | null> {
  try {
    const { payload } = await jwtVerify<MfaClaims>(token, secretKey());
    if (payload.purpose !== "mfa") return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_S,
};

export const MFA_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MFA_TTL_S,
};

import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken, type AppUserRole } from "@/lib/auth/jwt";

/**
 * Node-only, DB-backed authoritative auth check. Middleware (src/middleware.ts)
 * is a latency optimization that only verifies the JWT's signature/expiry;
 * every protected route handler must call requireSession()/requireCapability()
 * itself — this is what actually confirms the session hasn't been revoked and
 * reads the user's role fresh from the database, so a suspension or role
 * change takes effect immediately rather than waiting for token expiry.
 */
export interface SessionContext {
  sessionId: string;
  userId: string;
  tenantId: string;
  role: AppUserRole;
  branchId: string | null;
  name: string;
  email: string;
  issuedAt: number;
  expiresAt: number;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const session = await prisma.session.findUnique({
    where: { id: claims.sid },
    include: { user: true },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt < new Date() ||
    session.user.status !== "active"
  ) {
    return null;
  }

  return {
    sessionId: session.id,
    userId: session.user.id,
    tenantId: session.tenantId,
    role: session.user.role,
    branchId: session.user.branchId,
    name: session.user.name,
    email: session.user.email,
    issuedAt: session.issuedAt.getTime(),
    expiresAt: session.expiresAt.getTime(),
  };
}

export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) throw new AuthError("Unauthenticated", 401);
  return ctx;
}

export async function requireCapability(capabilityId: string): Promise<SessionContext> {
  const ctx = await requireSession();
  const granted = await serverCan(ctx.tenantId, ctx.role, capabilityId);
  if (!granted) throw new AuthError("Forbidden", 403);
  return ctx;
}

/** Server-side capability check — Owner is always fully granted, same no-lockout guarantee as the client matrix (core/data/permissions.ts). */
export async function serverCan(tenantId: string, role: AppUserRole, capabilityId: string): Promise<boolean> {
  if (role === "Owner") return true;
  const row = await prisma.rolePermission.findUnique({
    where: { tenantId_role_capabilityId: { tenantId, role, capabilityId } },
  });
  return row?.granted ?? false;
}

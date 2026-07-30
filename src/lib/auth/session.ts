import "server-only";
import { prisma } from "@/lib/db";
import { SESSION_TTL_S, signSessionToken, type AppUserRole } from "@/lib/auth/jwt";

/** Creates a real Session row + signs the JWT cookie value for it. Shared by the login and mfa routes (mfa also establishes a session, on successful code verification). */
export async function establishSession(
  userId: string,
  tenantId: string,
  role: AppUserRole,
  branchId: string | null,
  name: string,
  email: string,
) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_S * 1000);
  const [session] = await prisma.$transaction([
    prisma.session.create({ data: { tenantId, userId, expiresAt } }),
    prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }),
  ]);

  const token = await signSessionToken({
    sid: session.id,
    uid: userId,
    tid: tenantId,
    role,
    bid: branchId,
    name,
    email,
  });

  return {
    token,
    userId,
    name,
    email,
    role,
    branchId,
    issuedAt: session.issuedAt.getTime(),
    expiresAt: expiresAt.getTime(),
  };
}

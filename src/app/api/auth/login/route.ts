import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getDefaultTenant } from "@/lib/auth/tenant";
import { establishSession } from "@/lib/auth/session";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, MFA_COOKIE, MFA_COOKIE_OPTIONS, signMfaToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().min(1).max(200),
  password: z.string().min(1).max(200),
});

// A constant hash to compare against on the "user not found" path, so the
// response time doesn't leak whether an email exists (timing side-channel).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid-request" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const tenant = await getDefaultTenant();
  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });

  // Always run a compare (against a constant dummy hash when the user
  // doesn't exist) so response timing doesn't leak whether the email is
  // registered — a real side-channel a naive "return early" would open.
  const passwordOk = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    // In production, collapse both cases into one generic error so the
    // response itself can't be used to enumerate registered emails. The
    // pilot keeps the distinct, more helpful message since SHOW_DEMO_LOGINS
    // already publishes the user list via /api/auth/demo-accounts.
    const showDetail = process.env.SHOW_DEMO_LOGINS === "true";
    const error = showDetail && user ? "wrong-password" : "not-found";
    return NextResponse.json({ ok: false, error }, { status: 401 });
  }
  if (user.status === "suspended") {
    return NextResponse.json({ ok: false, error: "suspended" }, { status: 403 });
  }
  if (user.status === "invited") {
    return NextResponse.json({ ok: false, error: "invited" }, { status: 403 });
  }

  if (user.mfaEnabled) {
    const mfaToken = await signMfaToken({ uid: user.id, tid: tenant.id });
    const res = NextResponse.json({ ok: true, needsMfa: true });
    res.cookies.set(MFA_COOKIE, mfaToken, MFA_COOKIE_OPTIONS);
    return res;
  }

  const { token, ...session } = await establishSession(
    user.id,
    tenant.id,
    user.role,
    user.branchId,
    user.name,
    user.email,
  );
  const res = NextResponse.json({ ok: true, needsMfa: false, session });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}

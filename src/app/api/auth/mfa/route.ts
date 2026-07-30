import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { establishSession } from "@/lib/auth/session";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, MFA_COOKIE, verifyMfaToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().min(1).max(20),
});

/**
 * Reads uid/tid from the MFA cookie set by /api/auth/login, never from the
 * request body — a naive port that trusted a client-supplied userId here
 * would let anyone who knows the demo code sign in as ANY user without
 * ever supplying a password. The cookie is what makes this step provably
 * continuous with the credential check that came before it.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid-request" }, { status: 400 });
  }

  const store = await cookies();
  const mfaToken = store.get(MFA_COOKIE)?.value;

  const claims = mfaToken ? await verifyMfaToken(mfaToken) : null;
  if (!claims) {
    return NextResponse.json({ ok: false, error: "expired" }, { status: 401 });
  }

  const expectedCode = process.env.DEMO_MFA_CODE ?? "000000";
  if (parsed.data.code !== expectedCode) {
    return NextResponse.json({ ok: false, error: "wrong-code" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: claims.uid } });
  if (!user || user.status !== "active") {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 401 });
  }

  const { token, ...session } = await establishSession(
    user.id,
    claims.tid,
    user.role,
    user.branchId,
    user.name,
    user.email,
  );
  const res = NextResponse.json({ ok: true, session });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  res.cookies.set(MFA_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

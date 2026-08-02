import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/jwt";

/**
 * Edge pre-filter — cheap signature+expiry check only, no DB call (Prisma's
 * Node client can't run here). This is a latency optimization, NOT the
 * authorization decision: every protected route handler calls
 * requireSession()/requireCapability() itself (src/lib/auth/server.ts),
 * which is the authoritative, DB-backed check. Returns 401 JSON rather than
 * redirecting, so client fetch() call sites fail predictably instead of
 * receiving an HTML login page as a "response".
 *
 * /dashboard is deliberately NOT matched here — it already self-gates by
 * rendering <LoginScreen> when useSession() is null, and /api/auth/session
 * is deliberately excluded — it's a "who am I" probe that must return 200
 * with {session:null}, not 401.
 */
export const config = {
  matcher: [
    "/api/leads/:path*",
    "/api/users/:path*",
    "/api/permissions/:path*",
    "/api/brochures/:path*",
    "/api/audit/:path*",
  ],
};

export async function middleware(request: NextRequest) {
  // POST /api/leads (exactly this path+method) is the one deliberate
  // exception: it's how the unauthenticated /companion flow creates a
  // lead. The route handler resolves the tenant from DEFAULT_TENANT_SLUG
  // when no session cookie is present — see the SECURITY comment on that
  // route for the tradeoff this represents. Every other leads/users/
  // permissions path requires a real session.
  const { pathname } = request.nextUrl;
  if (pathname === "/api/leads" && request.method === "POST") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (!claims) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  return NextResponse.next();
}

import { NextResponse } from "next/server";
import { demoRequestSchema } from "@/lib/demo-request-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = demoRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Some fields need attention.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  // TODO(next phase): forward to a CRM/email service (e.g. HubSpot, Resend)
  // instead of just logging. There's no ESP or CRM configured for this
  // marketing site yet — this is the same "to activate" disclosure pattern
  // the product app uses for its own not-yet-wired integrations.
  console.log("[demo-request]", {
    ...parsed.data,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

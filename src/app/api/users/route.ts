import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toUserDTO } from "@/lib/serializers/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().min(1).max(200),
  role: z.enum(["Owner", "Admin", "Manager", "Designer", "Salesperson", "Viewer"]),
  branchId: z.string().nullable(),
});

export async function GET() {
  try {
    const ctx = await requireCapability("users.manage");
    const users = await prisma.user.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ users: users.map(toUserDTO) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

/** Invite is simulated (no mail provider) — same as today's UI behavior, only the status transition is real. */
export async function POST(request: Request) {
  try {
    const ctx = await requireCapability("users.manage");
    const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(process.env.SEED_DEMO_PASSWORD ?? "demo1234", 12);

    const user = await prisma.user
      .create({
        data: {
          tenantId: ctx.tenantId,
          name: parsed.data.name,
          email,
          role: parsed.data.role,
          branchId: parsed.data.branchId,
          status: "invited",
          mfaEnabled: false,
          passwordHash,
        },
      })
      .catch((e: { code?: string }) => {
        if (e?.code === "P2002") return null;
        throw e;
      });

    if (!user) {
      return NextResponse.json({ error: "already-exists" }, { status: 409 });
    }
    return NextResponse.json({ user: toUserDTO(user) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

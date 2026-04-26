import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user || (user.role as any) !== "ADMIN") return null;
  return user;
}

function generateCode(): string {
  // 8 hex chars in two groups, prefixed for readability: BETA-XXXX-XXXX
  const raw = randomBytes(4).toString("hex").toUpperCase();
  return `BETA-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

const StatusFilter = z.enum(["all", "claimed", "unclaimed"]).default("all");

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const status = StatusFilter.parse(url.searchParams.get("status") ?? "all");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);

  const where =
    status === "claimed"
      ? { claimedByUserId: { not: null } }
      : status === "unclaimed"
      ? { claimedByUserId: null }
      : {};

  const invites = await prisma.betaInvite.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      claimedBy: {
        select: { id: true, username: true, email: true },
      },
    },
  });

  return NextResponse.json({ ok: true, invites });
}

const CreateBody = z.object({
  count: z.number().int().min(1).max(100).default(1),
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await req.json().catch(() => ({}));
  const parsed = CreateBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const codes: string[] = [];
  // Retry on the (extremely unlikely) unique-collision case.
  for (let i = 0; i < parsed.data.count; i++) {
    let attempts = 0;
    while (attempts < 5) {
      const code = generateCode();
      try {
        await prisma.betaInvite.create({ data: { code } });
        codes.push(code);
        break;
      } catch (err: any) {
        if (err?.code === "P2002") {
          attempts++;
          continue;
        }
        console.error("[admin/invites] create failed", err);
        return NextResponse.json({ error: "Failed to create invite." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true, created: codes.length, codes });
}

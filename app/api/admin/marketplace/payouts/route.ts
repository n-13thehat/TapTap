import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function isAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return false;
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return user?.role === ("ADMIN" as any);
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "PENDING_APPROVAL").toUpperCase();
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 50)));

    const allowed = ["PENDING_APPROVAL", "UNCLAIMED", "CLAIMED", "DISPUTED"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = prisma as any;
    const rows = await db.externalArtistRoyalty.findMany({
      where: { status },
      orderBy: { updatedAt: "asc" },
      take: limit,
      select: {
        id: true,
        source: true,
        sourceId: true,
        stageName: true,
        pendingTap: true,
        status: true,
        claimedByUserId: true,
        createdAt: true,
        updatedAt: true,
        claimedByUser: { select: { id: true, username: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, status, count: rows.length, payouts: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load payouts" }, { status: 500 });
  }
}

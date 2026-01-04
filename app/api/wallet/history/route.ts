import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";

export async function GET(req: Request) {
  const rl = await rateGate(req, "wallet:history", { capacity: 30, refillPerSec: 0.5 });
  if (rl) return rl;
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000);
  const [txns, taxEvents, distributions] = await Promise.all([
    prisma.tapCoinTransaction.findMany({ where: { userId: user.id, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 100 }),
    // Optional tables: guard if not present in client
    (prisma as any).taxEvent?.findMany
      ? (prisma as any).taxEvent.findMany({
          where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }], createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : [],
    (prisma as any).distribution?.findMany
      ? (prisma as any).distribution.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 50 })
      : [],
  ]);

  return NextResponse.json({ txns, taxEvents, distributions });
}

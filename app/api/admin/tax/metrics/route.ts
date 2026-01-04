import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";

async function requireAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user || (user.role as any) !== "ADMIN") return null;
  return user;
}

export async function GET(req: Request) {
  const rl = await rateGate(req, "admin:tax:metrics", { capacity: 10, refillPerSec: 0.1 });
  if (rl) return rl;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const hasTaxEvent = Boolean((prisma as any).taxEvent?.aggregate);
  const hasDistribution = Boolean((prisma as any).distribution?.aggregate);

  const taxAgg = hasTaxEvent
    ? await (prisma as any).taxEvent.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { tax: true, treasury: true, burn: true },
      })
    : { _sum: { tax: 0, treasury: 0, burn: 0 } };

  const distAgg = hasDistribution
    ? await (prisma as any).distribution.groupBy({
        by: ["type"],
        where: { createdAt: { gte: since } },
        _sum: { amount: true },
      })
    : [];

  const tUser = process.env.TREASURY_USER_ID;
  let treasuryBalance = null as number | null;
  if (tUser) {
    const bal = await prisma.tapCoinTransaction.aggregate({ where: { userId: tUser }, _sum: { amount: true } });
    treasuryBalance = bal._sum.amount ?? 0;
  }

  return NextResponse.json({
    windowDays: 30,
    totals: {
      tax: taxAgg._sum.tax ?? 0,
      treasury: taxAgg._sum.treasury ?? 0,
      burn: taxAgg._sum.burn ?? 0,
    },
    distributions: distAgg,
    treasuryBalance,
  });
}




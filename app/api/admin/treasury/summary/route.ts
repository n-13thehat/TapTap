import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { parseRange, bucketDates, dateKey } from "@/lib/dateRange";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";

const Q = z.object({ from: z.string().optional(), to: z.string().optional(), interval: z.enum(["day", "week", "month"]).optional() });

export async function GET(req: Request) {
  const rl = await rateGate(req, "admin:treasury:summary", { capacity: 30, refillPerSec: 0.5 });
  if (rl) return rl;
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const qp = Q.safeParse(Object.fromEntries(url.searchParams));
  if (!qp.success) return NextResponse.json({ error: "Invalid query", issues: qp.error.issues }, { status: 400 });

  const { from, to, interval } = parseRange(url.searchParams);

  const treasuryUserId = process.env.TREASURY_USER_ID;
  const treasuryWallet = process.env.TREASURY_WALLET_ADDRESS;

  const [taxEvents, tipsPositive, trapBalance] = await Promise.all([
    (prisma as any).taxEvent.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, amount: true, tax: true, treasury: true, burn: true },
    }),
    prisma.tapCoinTransaction.findMany({
      where: { reason: "TIP", amount: { gt: 0 }, createdAt: { gte: from, lte: to } },
      select: { amount: true, createdAt: true },
    }),
    treasuryUserId
      ? prisma.tapCoinTransaction.aggregate({
          _sum: { amount: true },
          where: { userId: treasuryUserId, reason: "TAPTAX_TREASURY" },
        })
      : { _sum: { amount: 0 } },
  ]);

  const buckets = bucketDates(from, to, interval);
  const idx = new Map<string, { gross: number; tax: number; tre: number; burn: number; tips: number }>();
  for (const b of buckets) idx.set(dateKey(b, interval), { gross: 0, tax: 0, tre: 0, burn: 0, tips: 0 });

  for (const t of taxEvents) {
    const k = dateKey(t.createdAt, interval);
    const row = idx.get(k) || { gross: 0, tax: 0, tre: 0, burn: 0, tips: 0 };
    row.gross += t.amount || 0;
    row.tax += t.tax || 0;
    row.tre += t.treasury || 0;
    row.burn += t.burn || 0;
    idx.set(k, row);
  }
  for (const tip of tipsPositive) {
    const k = dateKey(tip.createdAt, interval);
    const row = idx.get(k) || { gross: 0, tax: 0, tre: 0, burn: 0, tips: 0 };
    row.tips += tip.amount || 0;
    idx.set(k, row);
  }

  const kpis = Array.from(idx.values()).reduce(
    (a, v) => ({
      gross: a.gross + v.gross,
      tax: a.tax + v.tax,
      tre: a.tre + v.tre,
      burn: a.burn + v.burn,
      tips: a.tips + v.tips,
    }),
    { gross: 0, tax: 0, tre: 0, burn: 0, tips: 0 }
  );

  const bucketKeys = buckets.map((b) => dateKey(b, interval));
  const series = bucketKeys.map((k) => idx.get(k) || { gross: 0, tax: 0, tre: 0, burn: 0, tips: 0 });

  return NextResponse.json({
    kpis: {
      grossVolume: String(kpis.gross),
      taxCollected: String(kpis.tax),
      toTreasury: String(kpis.tre),
      burned: String(kpis.burn),
      tipsVolume: String(kpis.tips),
    },
    series: {
      buckets: bucketKeys,
      grossVolume: series.map((s) => String(s.gross)),
      taxCollected: series.map((s) => String(s.tax)),
      toTreasury: series.map((s) => String(s.tre)),
      burned: series.map((s) => String(s.burn)),
      tipsVolume: series.map((s) => String(s.tips)),
    },
    trap: {
      userId: treasuryUserId || null,
      wallet: treasuryWallet || null,
      balance: String(trapBalance?._sum?.amount || 0),
    },
  });
}

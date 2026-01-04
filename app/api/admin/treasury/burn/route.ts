import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";

const Q = z.object({ from: z.string().optional(), to: z.string().optional(), cursor: z.string().optional(), limit: z.coerce.number().int().positive().max(200).optional() });

export async function GET(req: Request) {
  const rl = await rateGate(req, "admin:treasury:burn", { capacity: 30, refillPerSec: 0.5 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const qp = Q.safeParse(Object.fromEntries(url.searchParams));
  if (!qp.success) return NextResponse.json({ error: "Invalid query", issues: qp.error.issues }, { status: 400 });
  const { from, to, cursor } = qp.data;
  const limit = qp.data.limit ?? 50;

  const where: any = { type: "BURN" };
  if (from || to) where.createdAt = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
  if (cursor) where.id = { lt: cursor };

  const rows = await (prisma as any).distribution.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: limit + 1 });
  const nextCursor = rows.length > limit ? rows[limit].id : undefined;
  const slice = rows.slice(0, limit).map((r: any) => ({ id: r.id, amount: String(r.amount), createdAt: r.createdAt.toISOString(), note: r.note || null }));
  const total = await (prisma as any).distribution.aggregate({ where, _sum: { amount: true } });
  return NextResponse.json({ items: slice, nextCursor, totalBurned: String(total._sum.amount || 0) });
}


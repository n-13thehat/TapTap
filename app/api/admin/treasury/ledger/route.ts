import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";

const Q = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.enum(["purchase", "resale", "transfer", "swap"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  sort: z.enum(["createdAt"]).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
});

export async function GET(req: Request) {
  const rl = await rateGate(req, "admin:treasury:ledger", { capacity: 30, refillPerSec: 0.5 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const qp = Q.safeParse(Object.fromEntries(url.searchParams));
  if (!qp.success) return NextResponse.json({ error: "Invalid query", issues: qp.error.issues }, { status: 400 });
  const { from, to, type, cursor } = qp.data;
  const limit = qp.data.limit ?? 50;
  const sortField = qp.data.sort || "createdAt";
  const sortDir = qp.data.dir || "desc";

  const where: any = {};
  if (from || to) where.createdAt = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
  if (type) where.reason = type.toUpperCase();
  if (cursor) where.id = { lt: cursor };

  const rows = await (prisma as any).taxEvent.findMany({
    where,
    orderBy: [{ [sortField]: sortDir }, { id: sortDir }],
    take: limit + 1,
    select: { id: true, createdAt: true, amount: true, tax: true, treasury: true, burn: true, reason: true, fromUserId: true, toUserId: true },
  });
  const nextCursor = rows.length > limit ? rows[limit].id : undefined;
  const slice = rows.slice(0, limit);

  const userIds = Array.from(new Set(slice.flatMap((r: any) => [r.fromUserId, r.toUserId]).filter(Boolean))).map(String);
  const users = await prisma.user.findMany({ where: { id: { in: userIds as string[] } }, select: { id: true, username: true, walletAddress: true } });
  const uMap = new Map(users.map((u) => [u.id, u] as const));

  const items = slice.map((r: any) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    type: (r.reason || "TRANSFER").toLowerCase(),
    basisAmount: String(r.amount || 0),
    taxAmount: String(r.tax || 0),
    toTreasury: String(r.treasury || 0),
    burned: String(r.burn || 0),
    from: {
      wallet: (uMap.get(r.fromUserId!) as any)?.walletAddress || "",
      user: uMap.get(r.fromUserId!) ? {
        id: r.fromUserId!,
        username: (uMap.get(r.fromUserId!) as any)?.username || null
      } : undefined
    },
    to: {
      wallet: (uMap.get(r.toUserId!) as any)?.walletAddress || "",
      user: uMap.get(r.toUserId!) ? {
        id: r.toUserId!,
        username: (uMap.get(r.toUserId!) as any)?.username || null
      } : undefined
    },
  }));

  return NextResponse.json({ items, nextCursor });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";
import { toCsv } from "@/lib/csv";

const Q = z.object({ from: z.string().optional(), to: z.string().optional(), scope: z.enum(["ledger", "burn", "summary"]) });

export async function GET(req: Request) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const qp = Q.safeParse(Object.fromEntries(url.searchParams));
  if (!qp.success) return NextResponse.json({ error: "Invalid query", issues: qp.error.issues }, { status: 400 });
  const { from, to, scope } = qp.data;
  const whereRange = from || to ? { createdAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {};

  let csv = "";
  if (scope === "burn") {
    const rows = await (prisma as any).distribution.findMany({ where: { type: "BURN", ...(whereRange as any) }, orderBy: { createdAt: "asc" } });
    csv = toCsv(rows.map((r: any) => ({ id: r.id, createdAt: r.createdAt.toISOString(), amount: r.amount, note: r.note || "" })), ["id", "createdAt", "amount", "note"]);
  } else if (scope === "ledger") {
    const rows = await (prisma as any).taxEvent.findMany({ where: whereRange as any, orderBy: { createdAt: "asc" } });
    csv = toCsv(
      rows.map((r: any) => ({ id: r.id, createdAt: r.createdAt.toISOString(), type: r.reason || "TRANSFER", basisAmount: r.amount, taxAmount: r.tax, toTreasury: r.treasury, burned: r.burn, fromUserId: r.fromUserId, toUserId: r.toUserId })),
      ["id", "createdAt", "type", "basisAmount", "taxAmount", "toTreasury", "burned", "fromUserId", "toUserId"]
    );
  } else {
    // summary
    const [tAgg, tips] = await Promise.all([
      (prisma as any).taxEvent.aggregate({ where: whereRange as any, _sum: { amount: true, tax: true, treasury: true, burn: true } }),
      prisma.tapCoinTransaction.aggregate({ where: { reason: "TIP", ...(whereRange as any) }, _sum: { amount: true } }),
    ]);
    const row = [{ metric: "grossVolume", value: String(tAgg._sum.amount || 0) }, { metric: "taxCollected", value: String(tAgg._sum.tax || 0) }, { metric: "toTreasury", value: String(tAgg._sum.treasury || 0) }, { metric: "burned", value: String(tAgg._sum.burn || 0) }, { metric: "tipsVolume", value: String(tips._sum.amount || 0) }];
    csv = toCsv(row, ["metric", "value"]);
  }

  return new NextResponse(csv, { status: 200, headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=treasury_export.csv" } });
}


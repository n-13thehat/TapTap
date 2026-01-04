import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { applyTapTaxTransfer } from "@/lib/tax";

type SendBody = {
  toUserId?: string;
  toUsername?: string;
  amount?: number;
  reason?: string;
  idempotencyKey?: string;
};

function dailyLimit(): number {
  const v = Number(process.env.TAPCOIN_DAILY_SEND_LIMIT || 100000);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 100000;
}

async function getBalance(userId: string) {
  const sum = await prisma.tapCoinTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return sum._sum.amount ?? 0;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = (session as any)?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sender = await prisma.user.findUnique({ where: { email }, select: { id: true, username: true } });
    if (!sender) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = (await req.json()) as SendBody;
    const amount = Math.floor(Number(body.amount || 0));
    if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });

    // Resolve recipient
    let recipient = null as null | { id: string };
    if (body.toUserId) recipient = await prisma.user.findUnique({ where: { id: body.toUserId }, select: { id: true } });
    else if (body.toUsername) recipient = await prisma.user.findUnique({ where: { username: body.toUsername }, select: { id: true } });
    if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    if (recipient.id === sender.id) return NextResponse.json({ error: "Cannot send to self" }, { status: 400 });

    // Idempotency (per-sender)
    const idem = String(body.idempotencyKey || "").trim();
    if (idem) {
      const existing = await prisma.setting.findUnique({ where: { userId_key: { userId: sender.id, key: `tapcoin:idem:${idem}` } } });
      if (existing) return NextResponse.json({ ok: true, idempotent: true });
    }

    // Daily limit check
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const sentToday = await prisma.tapCoinTransaction.aggregate({
      where: { userId: sender.id, amount: { lt: 0 }, createdAt: { gte: since } },
      _sum: { amount: true },
    });
    const absSent = Math.abs(sentToday._sum.amount ?? 0);
    const limit = dailyLimit();
    if (absSent + amount > limit) return NextResponse.json({ error: "Daily limit exceeded" }, { status: 429 });

    // Balance check
    const balance = await getBalance(sender.id);
    if (balance < amount) return NextResponse.json({ error: "Insufficient balance", balance }, { status: 400 });

    // Perform debit/credit with TapTax applied unless reason is TIP
    await applyTapTaxTransfer({ fromUserId: sender.id, toUserId: recipient.id, amount, reason: body.reason });

    // Persist idempotency marker (post-transfer) if provided
    if (idem) {
      await prisma.setting.upsert({
        where: { userId_key: { userId: sender.id, key: `tapcoin:idem:${idem}` } },
        update: { value: { amount, to: recipient.id, at: new Date().toISOString() } as any },
        create: { userId: sender.id, key: `tapcoin:idem:${idem}`, value: { amount, to: recipient.id } as any },
      });
    }

    const newBalance = await getBalance(sender.id);
    return NextResponse.json({ ok: true, balance: newBalance });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

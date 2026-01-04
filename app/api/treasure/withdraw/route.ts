import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

type WithdrawBody = { amount?: number; walletAddress?: string; provider?: "SOLANA" | "STRIPE" };

async function getBalance(userId: string) {
  const sum = await prisma.tapCoinTransaction.aggregate({ where: { userId }, _sum: { amount: true } });
  return sum._sum.amount ?? 0;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = (session as any)?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = (await req.json()) as WithdrawBody;
    const amount = Math.floor(Number(body.amount || 0));
    if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });
    const balance = await getBalance(user.id);
    if (balance < amount) return NextResponse.json({ error: "Insufficient balance", balance }, { status: 400 });

    const provider = body.provider || "SOLANA";
    const address = String(body.walletAddress || "").trim();
    if (!address) return NextResponse.json({ error: "walletAddress required" }, { status: 400 });

    // Ensure a Wallet row exists (or create)
    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: { userId: user.id },
      create: { address, userId: user.id, provider },
    });

    await prisma.tapCoinTransaction.create({
      data: { userId: user.id, walletId: wallet.id, amount: -amount, reason: "WITHDRAW" },
    });

    const newBalance = await getBalance(user.id);
    return NextResponse.json({ ok: true, balance: newBalance });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

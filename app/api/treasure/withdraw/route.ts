import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const WithdrawBody = z.object({
  amount: z.number().int().positive().max(1_000_000_000),
  walletAddress: z.string().trim().min(32).max(64),
  provider: z.enum(["SOLANA", "STRIPE"]).optional(),
});

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

    const raw = await req.json().catch(() => null);
    const parsed = WithdrawBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
    }
    const amount = parsed.data.amount;
    const balance = await getBalance(user.id);
    if (balance < amount) return NextResponse.json({ error: "Insufficient balance", balance }, { status: 400 });

    const provider = parsed.data.provider || "SOLANA";
    const address = parsed.data.walletAddress;

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

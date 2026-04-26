import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

const TxnBody = z.object({
  kind: z.string().trim().min(1).max(40).optional(),
  amount: z.number().finite(),
  currency: z.enum(["USD", "TAP", "SOL"]).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const meId = (session as any)?.user?.id as string | undefined;
    if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const raw = await req.json().catch(() => null);
    const parsed = TxnBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
    }
    const amount = parsed.data.amount;
    const currency = parsed.data.currency || "USD";
    const wallet = await prisma.wallet.findFirst({ where: { userId: meId }, select: { id: true } });
    await prisma.transaction.create({ data: { amount: Math.round(amount), currency: currency as any, walletId: wallet?.id || null, buyerId: meId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


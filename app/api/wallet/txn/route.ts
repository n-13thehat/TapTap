import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const meId = (session as any)?.user?.id as string | undefined;
    if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const kind = String(body?.kind || "");
    const amount = Number(body?.amount || 0);
    const currency = (String(body?.currency || "USD").toUpperCase()) as "USD" | "TAP" | "SOL";
    const wallet = await prisma.wallet.findFirst({ where: { userId: meId }, select: { id: true } });
    await prisma.transaction.create({ data: { amount: Math.round(amount), currency: currency as any, walletId: wallet?.id || null, buyerId: meId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


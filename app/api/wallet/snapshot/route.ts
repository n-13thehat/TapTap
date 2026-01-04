import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const [sum, solanaWallet] = await Promise.all([
      prisma.tapCoinTransaction.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
      prisma.wallet.findFirst({ where: { userId: user.id, provider: "SOLANA" as any }, select: { address: true } }),
    ]);
    const tap = Number(sum._sum.amount || 0);
    const solana = solanaWallet?.address || null;
    return Response.json({ tap, solanaAddress: solana });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}


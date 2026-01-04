import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const wallets = await prisma.wallet.findMany({ where: { userId: user.id, provider: "SOLANA" as any }, select: { id: true, address: true } });
    const out: any[] = [];
    for (const w of wallets) {
      let type = 'external';
      try {
        const s = await prisma.setting.findUnique({ where: { userId_key: { userId: w.id, key: 'sol:secret' } } });
        if (s) type = 'custodial';
      } catch {}
      out.push({ id: w.id, address: w.address, type });
    }
    return Response.json({ wallets: out });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

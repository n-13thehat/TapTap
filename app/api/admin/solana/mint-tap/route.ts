import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { mintTapTo } from "@/lib/solana";

async function isAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return false;
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return (user as any)?.role === 'ADMIN';
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    let address = String(body.address || '').trim();
    const amount = Math.max(0, Math.floor(Number(body.amount || 0)));
    if (!address && (body.userId || body.email)) {
      const where: any = body.userId ? { id: String(body.userId) } : { email: String(body.email) };
      const user = await prisma.user.findUnique({ where, select: { id: true } });
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      const w = await prisma.wallet.findFirst({ where: { userId: user.id, provider: 'SOLANA' as any } });
      if (!w) return Response.json({ error: 'No SOLANA wallet for user' }, { status: 404 });
      address = w.address;
    }
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });
    if (!amount) return Response.json({ error: 'amount required' }, { status: 400 });
    await mintTapTo(address, amount);
    return Response.json({ ok: true, address, amount });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}




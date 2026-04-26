import { z } from "zod";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { mintTapTo } from "@/lib/solana";

const MintTapBody = z.object({
  address: z.string().trim().min(32).max(64).optional(),
  amount: z.number().int().positive().max(1_000_000_000),
  userId: z.string().trim().min(1).max(64).optional(),
  email: z.string().trim().toLowerCase().email().max(255).optional(),
}).refine((v) => Boolean(v.address || v.userId || v.email), {
  message: "Must provide address, userId, or email",
});

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
    const raw = await req.json().catch(() => null);
    const parsed = MintTapBody.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request body', issues: parsed.error.issues }, { status: 400 });
    }
    let address = parsed.data.address || '';
    const amount = parsed.data.amount;
    if (!address && (parsed.data.userId || parsed.data.email)) {
      const where: any = parsed.data.userId ? { id: parsed.data.userId } : { email: parsed.data.email };
      const user = await prisma.user.findUnique({ where, select: { id: true } });
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      const w = await prisma.wallet.findFirst({ where: { userId: user.id, provider: 'SOLANA' as any } });
      if (!w) return Response.json({ error: 'No SOLANA wallet for user' }, { status: 404 });
      address = w.address;
    }
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });
    await mintTapTo(address, amount);
    return Response.json({ ok: true, address, amount });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}




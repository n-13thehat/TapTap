import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const PriceBody = z.object({
  usd: z.number().nonnegative().finite(),
});

async function isAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return false;
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return (user as any)?.role === 'ADMIN';
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const raw = await req.json().catch(() => null);
    const parsed = PriceBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', issues: parsed.error.issues }, { status: 400 });
    }
    const { usd } = parsed.data;
    await prisma.setting.upsert({
      where: { userId_key: { userId: 'market', key: 'market:tap:usd' } },
      update: { value: { usd } as any },
      create: { userId: 'market', key: 'market:tap:usd', value: { usd } as any },
    });
    return NextResponse.json({ ok: true, usd });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}




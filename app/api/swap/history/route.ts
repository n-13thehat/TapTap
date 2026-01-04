import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const s = await prisma.setting.findUnique({ where: { userId_key: { userId: user.id, key: 'swap:sim:history' } } });
    const arr = (s?.value as any) || [];
    return NextResponse.json({ history: Array.isArray(arr) ? arr : [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}




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

const CACHE_KEY = 'market:sol:usd';
const CACHE_TTL_MS = 60_000;

async function readCached(): Promise<{ usd: number; fetchedAt: number } | null> {
  try {
    const s = await prisma.setting.findUnique({ where: { userId_key: { userId: 'market', key: CACHE_KEY } } });
    const v = s?.value as any;
    if (typeof v?.usd === 'number' && Number.isFinite(v.usd)) {
      return { usd: v.usd, fetchedAt: Number(v.fetchedAt || 0) };
    }
  } catch {}
  return null;
}

async function fetchCoinGeckoSol(): Promise<number | null> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    if (!res.ok) return null;
    const j = await res.json();
    const usd = Number(j?.solana?.usd);
    return Number.isFinite(usd) && usd > 0 ? usd : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const force = url.searchParams.get('refresh') === '1';
  const cached = await readCached();
  const now = Date.now();
  if (cached && !force && now - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ usd: cached.usd, source: 'cache', fetchedAt: cached.fetchedAt });
  }
  const live = await fetchCoinGeckoSol();
  if (live === null) {
    if (cached) return NextResponse.json({ usd: cached.usd, source: 'cache-stale', fetchedAt: cached.fetchedAt, warning: 'CoinGecko fetch failed' });
    return NextResponse.json({ error: 'CoinGecko unavailable' }, { status: 503 });
  }
  await prisma.setting.upsert({
    where: { userId_key: { userId: 'market', key: CACHE_KEY } },
    update: { value: { usd: live, fetchedAt: now } as any },
    create: { userId: 'market', key: CACHE_KEY, value: { usd: live, fetchedAt: now } as any },
  });
  return NextResponse.json({ usd: live, source: 'coingecko', fetchedAt: now });
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
      where: { userId_key: { userId: 'market', key: CACHE_KEY } },
      update: { value: { usd, fetchedAt: Date.now(), source: 'manual' } as any },
      create: { userId: 'market', key: CACHE_KEY, value: { usd, fetchedAt: Date.now(), source: 'manual' } as any },
    });
    return NextResponse.json({ ok: true, usd });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}




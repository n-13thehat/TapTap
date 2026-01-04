import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getPrice(keyEnv: string, settingKey: string) {
  const envV = process.env[keyEnv] ? Number(process.env[keyEnv]) : undefined;
  if (envV && Number.isFinite(envV)) return envV;
  try {
    const s = await prisma.setting.findFirst({ where: { key: settingKey } });
    const v = (s?.value as any)?.usd;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  } catch {}
  return 0;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tap = Number(url.searchParams.get('tap'));
    if (!Number.isFinite(tap) || tap <= 0) return NextResponse.json({ error: 'invalid tap amount' }, { status: 400 });
    const solUsd = await getPrice('SOL_PRICE_USD', 'market:sol:usd');
    const tapUsd = await getPrice('TAP_PRICE_USD', 'market:tap:usd');
    if (!solUsd || !tapUsd) return NextResponse.json({ error: 'price unavailable' }, { status: 503 });
    const usd = tap * tapUsd;
    const solOut = usd / solUsd;
    return NextResponse.json({ tap, solOut, usd, solUsd, tapUsd });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}


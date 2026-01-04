import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const envPrice = process.env.TAP_PRICE_USD ? Number(process.env.TAP_PRICE_USD) : undefined;
    if (envPrice && Number.isFinite(envPrice)) return NextResponse.json({ usd: envPrice });
    try {
      const s = await prisma.setting.findFirst({ where: { key: "market:tap:usd" } });
      const v = (s?.value as any)?.usd;
      if (typeof v === 'number' && Number.isFinite(v)) return NextResponse.json({ usd: v });
    } catch {}
    return NextResponse.json({ usd: 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}


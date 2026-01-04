import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const amount = Number(searchParams.get("amount") || "0");
  const quote = { rate: 0.00001, fee: 25, min: 100, max: 1_000_000 };
  if (amount <= 0) return NextResponse.json(quote);
  // Simple slippage simulation: more TAP slightly worse rate
  const rate = Math.max(0.000008, 0.00001 - Math.min(0.000002, amount / 1_000_000_000));
  return NextResponse.json({ ...quote, rate });
}

export async function POST() {
  // Accept swap request and return a fake txid
  return NextResponse.json({ ok: true, txid: `SWAP_${Date.now()}` });
}


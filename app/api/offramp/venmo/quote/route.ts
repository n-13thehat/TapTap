import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sol = Math.max(0, Number(searchParams.get("sol") || "0"));
  const rate = 175; // USD per SOL (demo)
  const feeUsd = 1.5;
  const networkFeeSol = 0.0005;
  const payoutEtaMin = 5;
  return NextResponse.json({ rate, feeUsd, networkFeeSol, payoutEtaMin, totalUsd: sol * rate - feeUsd });
}


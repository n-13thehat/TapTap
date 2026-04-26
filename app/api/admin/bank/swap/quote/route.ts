import { NextResponse } from "next/server";
import { z } from "zod";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";
import { isValidSolanaAddress } from "@/lib/solana";

const WSOL_MINT = "So11111111111111111111111111111111111111112";

const Q = z.object({
  inputMint: z.string().trim().min(32).max(64).optional(),
  outputMint: z.string().trim().min(32).max(64).optional(),
  amount: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  slippageBps: z.coerce.number().int().min(1).max(10_000).optional(),
  restrictIntermediateTokens: z.coerce.boolean().optional(),
});

function jupiterBase() {
  return process.env.JUPITER_API_BASE || "https://lite-api.jup.ag/swap/v1";
}

export async function GET(req: Request) {
  const rl = await rateGate(req, "admin:bank:swap:quote", { capacity: 30, refillPerSec: 0.5 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const qp = Q.safeParse(Object.fromEntries(url.searchParams));
  if (!qp.success) return NextResponse.json({ error: "Invalid query", issues: qp.error.issues }, { status: 400 });

  const inputMint = qp.data.inputMint || process.env.TAP_MINT_ADDRESS;
  const outputMint = qp.data.outputMint || WSOL_MINT;
  if (!inputMint) return NextResponse.json({ error: "inputMint required (or set TAP_MINT_ADDRESS)" }, { status: 400 });
  if (!isValidSolanaAddress(inputMint)) return NextResponse.json({ error: "Invalid inputMint" }, { status: 400 });
  if (!isValidSolanaAddress(outputMint)) return NextResponse.json({ error: "Invalid outputMint" }, { status: 400 });

  const slippageBps = qp.data.slippageBps ?? 50;
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(qp.data.amount),
    slippageBps: String(slippageBps),
  });
  if (qp.data.restrictIntermediateTokens) params.set("restrictIntermediateTokens", "true");

  try {
    const headers: Record<string, string> = {};
    if (process.env.JUPITER_API_KEY) headers["x-api-key"] = process.env.JUPITER_API_KEY;
    const res = await fetch(`${jupiterBase()}/quote?${params.toString()}`, { headers });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json({ error: "Jupiter quote failed", status: res.status, body }, { status: 502 });
    }
    return NextResponse.json({ ok: true, inputMint, outputMint, slippageBps, quote: body });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Quote failed" }, { status: 500 });
  }
}

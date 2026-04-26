import { NextResponse } from "next/server";
import { z } from "zod";
import { VersionedTransaction } from "@solana/web3.js";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";
import { getTreasuryKeypair, getSolanaConnection, isValidSolanaAddress } from "@/lib/solana";

const WSOL_MINT = "So11111111111111111111111111111111111111112";

const Body = z.object({
  inputMint: z.string().trim().min(32).max(64).optional(),
  outputMint: z.string().trim().min(32).max(64).optional(),
  amount: z.number().int().positive(),
  slippageBps: z.number().int().min(1).max(10_000).optional(),
  confirm: z.literal(true),
  note: z.string().trim().max(500).optional(),
});

function jupiterBase() {
  return process.env.JUPITER_API_BASE || "https://lite-api.jup.ag/swap/v1";
}

export async function POST(req: Request) {
  const rl = await rateGate(req, "admin:bank:swap:execute", { capacity: 3, refillPerSec: 0.05 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }

  if (!process.env.TREASURY_WALLET_SECRET) {
    return NextResponse.json({ error: "TREASURY_WALLET_SECRET not configured" }, { status: 503 });
  }

  const inputMint = parsed.data.inputMint || process.env.TAP_MINT_ADDRESS;
  const outputMint = parsed.data.outputMint || WSOL_MINT;
  if (!inputMint) return NextResponse.json({ error: "inputMint required (or set TAP_MINT_ADDRESS)" }, { status: 400 });
  if (!isValidSolanaAddress(inputMint)) return NextResponse.json({ error: "Invalid inputMint" }, { status: 400 });
  if (!isValidSolanaAddress(outputMint)) return NextResponse.json({ error: "Invalid outputMint" }, { status: 400 });

  const slippageBps = parsed.data.slippageBps ?? 50;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.JUPITER_API_KEY) headers["x-api-key"] = process.env.JUPITER_API_KEY;

  try {
    const treasury = getTreasuryKeypair();
    const userPublicKey = treasury.publicKey.toBase58();

    const qParams = new URLSearchParams({
      inputMint,
      outputMint,
      amount: String(parsed.data.amount),
      slippageBps: String(slippageBps),
    });
    const qRes = await fetch(`${jupiterBase()}/quote?${qParams.toString()}`, { headers });
    const quote = await qRes.json().catch(() => null);
    if (!qRes.ok || !quote) {
      return NextResponse.json({ error: "Jupiter quote failed", status: qRes.status, body: quote }, { status: 502 });
    }

    const sRes = await fetch(`${jupiterBase()}/swap`, {
      method: "POST",
      headers,
      body: JSON.stringify({ quoteResponse: quote, userPublicKey, wrapAndUnwrapSol: true }),
    });
    const swap = await sRes.json().catch(() => null);
    if (!sRes.ok || !swap?.swapTransaction) {
      return NextResponse.json({ error: "Jupiter swap build failed", status: sRes.status, body: swap }, { status: 502 });
    }

    const buf = Buffer.from(swap.swapTransaction, "base64");
    const tx = VersionedTransaction.deserialize(buf);
    tx.sign([treasury]);

    const connection = getSolanaConnection();
    const rawTx = tx.serialize();
    const signature = await connection.sendRawTransaction(rawTx, { skipPreflight: false, maxRetries: 3 });
    await connection.confirmTransaction(signature, "confirmed");

    await (prisma as any).distribution.create({
      data: {
        type: "TREASURY_SWAP",
        amount: parsed.data.amount,
        note: `${inputMint}->${outputMint} sig=${signature}${parsed.data.note ? ` ${parsed.data.note}` : ""}`,
      },
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      inputMint,
      outputMint,
      amount: parsed.data.amount,
      slippageBps,
      signature,
      outAmount: quote?.outAmount,
      priceImpactPct: quote?.priceImpactPct,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Swap failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth.config";

const DexBody = z.object({
  tap: z.number().positive().finite(),
});

/**
 * DEX swap (TAP -> SOL) via Jupiter quote API.
 * Mainnet-only unless Jupiter enables devnet routing. Executes a quote lookup;
 * execution should be performed by a custodial signer or user wallet (not included here).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const raw = await req.json().catch(() => null);
    const parsed = DexBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
    }
    const tap = parsed.data.tap;
    const cluster = (process.env.SOLANA_NETWORK || "devnet").toLowerCase();
    const tapMint = process.env.TAP_MINT_ADDRESS;
    const decimals = Number(process.env.TAP_DECIMALS || 0);

    if (!tapMint) return NextResponse.json({ error: "Missing TAP_MINT_ADDRESS" }, { status: 500 });
    if (cluster !== "mainnet" && cluster !== "mainnet-beta") {
      return NextResponse.json({ ok: false, status: "unsupported_cluster", message: "Jupiter mainnet-only; set SOLANA_NETWORK=mainnet and SOLANA_RPC_URL accordingly." }, { status: 501 });
    }

    const amount = BigInt(Math.floor(tap * Math.pow(10, decimals)));
    const url = new URL("https://quote-api.jup.ag/v6/quote");
    url.searchParams.set("inputMint", tapMint);
    url.searchParams.set("outputMint", "So11111111111111111111111111111111111111112");
    url.searchParams.set("amount", amount.toString());
    url.searchParams.set("slippageBps", "50");

    const quoteRes = await fetch(url.toString(), { cache: "no-store" });
    if (!quoteRes.ok) {
      const msg = await quoteRes.text().catch(() => quoteRes.statusText);
      return NextResponse.json({ ok: false, status: "quote_failed", message: msg }, { status: 502 });
    }
    const quote = await quoteRes.json();

    return NextResponse.json({
      ok: true,
      status: "quoted",
      quote,
      info: {
        tapRequested: tap,
        cluster: "mainnet",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

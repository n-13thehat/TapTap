import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { computeTapTax } from "@/lib/tax";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import crypto from "crypto";

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

type Body = { address?: string; tap?: number };

async function maybeMintTap(params: { address: string; amount: number; label: string }) {
  const mintAddr = process.env.TAP_MINT_ADDRESS;
  const authB64 = process.env.TAP_MINT_AUTH_SECRET;
  if (!mintAddr || !authB64 || !params.amount) return null;

  const decimals = Number(process.env.TAP_DECIMALS || 0);
  const network = process.env.SOLANA_NETWORK || "devnet";
  const rpc = process.env.SOLANA_RPC_URL || clusterApiUrl(network === "mainnet" ? "mainnet-beta" : "devnet");

  try {
    const secret = Buffer.from(authB64, "base64");
    const mintAuthority = Keypair.fromSecretKey(Uint8Array.from(secret));
    const conn = new Connection(rpc, "confirmed");
    const mint = new PublicKey(mintAddr);
    const owner = new PublicKey(params.address);
    const ata = await getOrCreateAssociatedTokenAccount(conn, mintAuthority, mint, owner);
    const raw = BigInt(params.amount) * (10n ** BigInt(decimals));
    const sig = await mintTo(conn, mintAuthority, mint, ata.address, mintAuthority, Number(raw));
    return { signature: sig, ata: ata.address.toBase58(), amount: params.amount, label: params.label };
  } catch (e: any) {
    console.error("[swap:onchain:mint] failed", e?.message || e);
    return { signature: null, error: e?.message || "mint failed", label: params.label };
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const { address, tap } = (await req.json()) as Body;
    const amt = Number(tap);
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });
    if (!Number.isFinite(amt) || amt <= 0) return NextResponse.json({ error: 'invalid tap amount' }, { status: 400 });
    const owned = await prisma.wallet.findFirst({ where: { userId: user.id, address, provider: 'SOLANA' as any }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const solUsd = await getPrice('SOL_PRICE_USD', 'market:sol:usd');
    const tapUsd = await getPrice('TAP_PRICE_USD', 'market:tap:usd');
    if (!solUsd || !tapUsd) return NextResponse.json({ error: 'price unavailable' }, { status: 503 });
    const usd = amt * tapUsd;
    const solOut = usd / solUsd;
    const { tax, treasury, burn } = computeTapTax(amt);
    const netTap = Math.max(0, amt - tax);

    const txId = `swap_${crypto.randomUUID()}`;

    // Append to simulated swap history (max 10 entries)
    const key = 'swap:sim:history';
    let hist: any[] = [];
    try {
      const s = await prisma.setting.findUnique({ where: { userId_key: { userId: user.id, key } } });
      if (s && s.value) hist = Array.isArray(s.value as any) ? (s.value as any) : [];
    } catch {}
    const entry = { id: txId, ts: new Date().toISOString(), address, tap: amt, solOut, usd, tax, burn, treasury };
    const next = [entry, ...hist].slice(0, 10);
    await prisma.setting.upsert({ where: { userId_key: { userId: user.id, key } }, update: { value: next as any }, create: { userId: user.id, key, value: next as any } });

    // Ledger: record debit + net credit; Treasury credit optional
    const ops: any[] = [];
    ops.push(prisma.tapCoinTransaction.create({ data: { userId: user.id, walletId: owned.id, amount: -amt, reason: "SWAP_TAP_TO_SOL" } }));
    if (netTap > 0) {
      ops.push(prisma.tapCoinTransaction.create({ data: { userId: user.id, walletId: owned.id, amount: netTap, reason: "SWAP_TAP_TO_SOL_CREDIT" } }));
    }
    const treasuryAddr = process.env.TREASURY_WALLET_ADDRESS;
    const treasuryUserId = process.env.TREASURY_USER_ID;
    if (treasury > 0 && treasuryAddr && treasuryUserId) {
      ops.push(
        prisma.wallet
          .upsert({
            where: { address: treasuryAddr },
            update: { userId: treasuryUserId },
            create: { address: treasuryAddr, userId: treasuryUserId, provider: "SOLANA" as any },
          })
          .then((w: any) =>
            prisma.tapCoinTransaction.create({
              data: { userId: treasuryUserId, walletId: w.id, amount: treasury, reason: "TAPTAX_TREASURY" },
            })
          )
      );
    }
    await prisma.$transaction(ops);

    // Optional on-chain settlement (mints TAP to user and treasury to mirror credit portions)
    let onChain: Record<string, any> | null = null;
    if (netTap > 0) {
      const primary = await maybeMintTap({ address, amount: netTap, label: "user" });
      const treasuryMint = treasury > 0 && treasuryAddr ? await maybeMintTap({ address: treasuryAddr, amount: treasury, label: "treasury" }) : null;
      onChain = { primary, treasury: treasuryMint };
    }

    return NextResponse.json({ ok: true, entry, tax: { tax, burn, treasury, netTap }, onChain });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}




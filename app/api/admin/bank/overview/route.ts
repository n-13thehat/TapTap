import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";
import { getSolanaConfig, solanaRpcCall, isValidSolanaAddress } from "@/lib/solana";

const Q = z.object({ sigLimit: z.coerce.number().int().min(1).max(50).optional() });

type MintInfo = {
  address: string;
  supply: string;
  decimals: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isInitialized: boolean;
} | null;

async function fetchMintInfo(mintAddress: string | undefined): Promise<MintInfo> {
  if (!mintAddress || !isValidSolanaAddress(mintAddress)) return null;
  const result = await solanaRpcCall("getAccountInfo", [mintAddress, { encoding: "jsonParsed" }]);
  const parsed = result?.value?.data?.parsed?.info;
  if (!parsed) return null;
  return {
    address: mintAddress,
    supply: String(parsed.supply ?? "0"),
    decimals: Number(parsed.decimals ?? 0),
    mintAuthority: parsed.mintAuthority ?? null,
    freezeAuthority: parsed.freezeAuthority ?? null,
    isInitialized: Boolean(parsed.isInitialized),
  };
}

async function fetchTreasuryBalances(treasuryAddress: string | undefined, mintAddress: string | undefined) {
  if (!treasuryAddress || !isValidSolanaAddress(treasuryAddress)) {
    return { sol: 0, lamports: 0, tap: 0, tapRaw: "0" };
  }
  const balance = await solanaRpcCall("getBalance", [treasuryAddress]);
  const lamports = Number(balance?.value || 0);

  let tap = 0;
  let tapRaw = "0";
  if (mintAddress && isValidSolanaAddress(mintAddress)) {
    const accounts = await solanaRpcCall("getTokenAccountsByOwner", [
      treasuryAddress,
      { mint: mintAddress },
      { commitment: "confirmed", encoding: "jsonParsed" },
    ]);
    const arr = accounts?.value || [];
    let totalUi = 0;
    let totalRaw = 0n;
    for (const it of arr) {
      const info = it?.account?.data?.parsed?.info?.tokenAmount;
      totalUi += Number(info?.uiAmount || 0);
      try { totalRaw += BigInt(info?.amount || "0"); } catch {}
    }
    tap = totalUi;
    tapRaw = totalRaw.toString();
  }

  return { sol: lamports / 1_000_000_000, lamports, tap, tapRaw };
}

async function fetchRecentSignatures(address: string | undefined, limit: number) {
  if (!address || !isValidSolanaAddress(address)) return [];
  const sigs = await solanaRpcCall("getSignaturesForAddress", [address, { limit }]);
  return Array.isArray(sigs) ? sigs.map((s: any) => ({
    signature: s.signature,
    slot: s.slot ?? null,
    blockTime: s.blockTime ?? null,
    err: s.err ? String(JSON.stringify(s.err)).slice(0, 200) : null,
    memo: s.memo ?? null,
  })) : [];
}

async function fetchOffChainTrap(treasuryUserId: string | undefined) {
  if (!treasuryUserId) return { balance: "0" };
  const agg = await prisma.tapCoinTransaction.aggregate({
    _sum: { amount: true },
    where: { userId: treasuryUserId, reason: "TAPTAX_TREASURY" },
  });
  return { balance: String(agg._sum.amount || 0) };
}

export async function GET(req: Request) {
  const rl = await rateGate(req, "admin:bank:overview", { capacity: 30, refillPerSec: 0.5 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const qp = Q.safeParse(Object.fromEntries(url.searchParams));
  if (!qp.success) return NextResponse.json({ error: "Invalid query", issues: qp.error.issues }, { status: 400 });
  const sigLimit = qp.data.sigLimit ?? 10;

  const cfg = getSolanaConfig();
  const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
  const treasuryUserId = process.env.TREASURY_USER_ID;

  try {
    const [mint, balances, signatures, trap] = await Promise.all([
      fetchMintInfo(cfg.tapMintAddress),
      fetchTreasuryBalances(treasuryAddress, cfg.tapMintAddress),
      fetchRecentSignatures(treasuryAddress, sigLimit),
      fetchOffChainTrap(treasuryUserId),
    ]);

    const warnings: string[] = [];
    if (!cfg.tapMintAddress) warnings.push("TAP_MINT_ADDRESS not configured");
    if (!treasuryAddress) warnings.push("TREASURY_WALLET_ADDRESS not configured");
    if (!treasuryUserId) warnings.push("TREASURY_USER_ID not configured");
    if (!process.env.TAP_MINT_AUTH_SECRET) warnings.push("TAP_MINT_AUTH_SECRET not configured (mint/burn/transfer will fail)");

    return NextResponse.json({
      network: cfg.network,
      rpcUrl: cfg.rpcUrl,
      treasury: {
        address: treasuryAddress || null,
        userId: treasuryUserId || null,
        sol: balances.sol,
        lamports: balances.lamports,
        tap: balances.tap,
        tapRaw: balances.tapRaw,
      },
      mint,
      offChainTrap: trap,
      recentSignatures: signatures,
      warnings,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

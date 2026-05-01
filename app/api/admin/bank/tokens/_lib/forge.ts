import { NextResponse } from "next/server";
import { Keypair } from "@solana/web3.js";
import type { ChainId } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptKEK } from "@/lib/crypto/kek";

export const ChainEnum = ["SOLANA_DEVNET", "SOLANA_TESTNET", "SOLANA_MAINNET"] as const;

export function expectedMainnetConfirm(action: string, symbol: string): string {
  return `MAINNET-${action}-${symbol}`;
}

export function checkMainnetConfirm(
  chain: ChainId,
  action: string,
  symbol: string,
  confirm: string | undefined,
): NextResponse | null {
  if (chain !== "SOLANA_MAINNET") return null;
  const expected = expectedMainnetConfirm(action, symbol);
  if (confirm !== expected) {
    return NextResponse.json(
      { error: "Mainnet confirm required", expected },
      { status: 400 },
    );
  }
  return null;
}

export function checkForgeEnv(): NextResponse | null {
  if (!process.env.TOKEN_FORGE_KEK) {
    return NextResponse.json({ error: "TOKEN_FORGE_KEK not configured" }, { status: 503 });
  }
  if (!process.env.TREASURY_WALLET_SECRET) {
    return NextResponse.json({ error: "TREASURY_WALLET_SECRET not configured" }, { status: 503 });
  }
  return null;
}

export function keypairFromCipher(cipher: string): Keypair {
  const secret = decryptKEK(cipher);
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

export async function logAudit(args: {
  tokenId: string;
  deploymentId?: string | null;
  action: string;
  actorUserId: string;
  payload: Record<string, unknown>;
}) {
  await prisma.tokenAuditEvent.create({
    data: {
      tokenId: args.tokenId,
      deploymentId: args.deploymentId ?? null,
      action: args.action,
      actorUserId: args.actorUserId,
      payload: args.payload as any,
    },
  }).catch(() => null);
}

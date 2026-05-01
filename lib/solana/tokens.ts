import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  AuthorityType,
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
} from "@solana/spl-token";
import type { ChainId } from "@prisma/client";
import { getChainMeta } from "./networks";
import { getTreasuryKeypair } from "@/lib/solana";

export function getConnectionFor(chain: ChainId): Connection {
  return new Connection(getChainMeta(chain).rpcUrl, "confirmed");
}

export const SOL_TO_LAMPORTS = (sol: number): number =>
  Math.round(sol * LAMPORTS_PER_SOL);

async function latestSignatureFor(
  conn: Connection,
  address: PublicKey,
): Promise<string> {
  const sigs = await conn.getSignaturesForAddress(address, { limit: 1 });
  return sigs[0]?.signature ?? "";
}

export async function createSplMint(args: {
  chain: ChainId;
  decimals: number;
  payer: Keypair;
  mintAuthority: PublicKey;
  freezeAuthority: PublicKey | null;
}): Promise<{ mintAddress: string; signature: string }> {
  const conn = getConnectionFor(args.chain);
  const mint = await createMint(
    conn,
    args.payer,
    args.mintAuthority,
    args.freezeAuthority,
    args.decimals,
  );
  const signature = await latestSignatureFor(conn, mint);
  return { mintAddress: mint.toBase58(), signature };
}

export async function mintToAddress(args: {
  chain: ChainId;
  mint: string;
  mintAuthority: Keypair;
  recipient: string;
  amount: bigint;
  payer: Keypair;
}): Promise<{ signature: string; ata: string }> {
  const conn = getConnectionFor(args.chain);
  const mintPk = new PublicKey(args.mint);
  const recipientPk = new PublicKey(args.recipient);
  const ata = await getOrCreateAssociatedTokenAccount(
    conn,
    args.payer,
    mintPk,
    recipientPk,
  );
  const signature = await mintTo(
    conn,
    args.payer,
    mintPk,
    ata.address,
    args.mintAuthority,
    args.amount,
  );
  return { signature, ata: ata.address.toBase58() };
}

export async function revokeMintAuthority(args: {
  chain: ChainId;
  mint: string;
  currentAuthority: Keypair;
  payer: Keypair;
}): Promise<{ signature: string }> {
  const conn = getConnectionFor(args.chain);
  const signature = await setAuthority(
    conn,
    args.payer,
    new PublicKey(args.mint),
    args.currentAuthority,
    AuthorityType.MintTokens,
    null,
  );
  return { signature };
}

export async function revokeFreezeAuthority(args: {
  chain: ChainId;
  mint: string;
  currentAuthority: Keypair;
  payer: Keypair;
}): Promise<{ signature: string }> {
  const conn = getConnectionFor(args.chain);
  const signature = await setAuthority(
    conn,
    args.payer,
    new PublicKey(args.mint),
    args.currentAuthority,
    AuthorityType.FreezeAccount,
    null,
  );
  return { signature };
}

export async function getMintInfo(args: { chain: ChainId; mint: string }) {
  const conn = getConnectionFor(args.chain);
  const info = await getMint(conn, new PublicKey(args.mint));
  return {
    supply: info.supply.toString(),
    decimals: info.decimals,
    mintAuthority: info.mintAuthority?.toBase58() ?? null,
    freezeAuthority: info.freezeAuthority?.toBase58() ?? null,
    isInitialized: info.isInitialized,
  };
}

export async function requestAirdropForTreasury(args: {
  chain: ChainId;
  lamports: number;
}): Promise<{ signature: string }> {
  const meta = getChainMeta(args.chain);
  if (!meta.supportsAirdrop) {
    throw new Error(`Airdrop not supported on ${meta.label}`);
  }
  const treasury = getTreasuryKeypair();
  const conn = getConnectionFor(args.chain);
  const signature = await conn.requestAirdrop(treasury.publicKey, args.lamports);
  await conn.confirmTransaction(signature);
  return { signature };
}

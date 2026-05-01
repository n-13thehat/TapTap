import { NextResponse } from "next/server";
import { z } from "zod";
import { Keypair } from "@solana/web3.js";
import type { ChainId } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";
import { getTreasuryKeypair } from "@/lib/solana";
import { createSplMint } from "@/lib/solana/tokens";
import { encryptKEK } from "@/lib/crypto/kek";
import {
  ChainEnum,
  checkForgeEnv,
  checkMainnetConfirm,
  logAudit,
} from "@/api/admin/bank/tokens/_lib/forge";

const UUID = z.string().uuid();
const Body = z.object({
  fromChain: z.enum(ChainEnum),
  toChain: z.enum(ChainEnum),
  notes: z.string().trim().max(500).optional(),
  confirm: z.string().trim().max(120).optional(),
}).refine((v) => v.fromChain !== v.toChain, { message: "fromChain and toChain must differ" });

const ALLOWED_PROMOTIONS: Record<ChainId, ChainId[]> = {
  SOLANA_DEVNET: ["SOLANA_TESTNET", "SOLANA_MAINNET"],
  SOLANA_TESTNET: ["SOLANA_MAINNET"],
  SOLANA_MAINNET: [],
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = await rateGate(req, "admin:bank:tokens:promote", { capacity: 3, refillPerSec: 0.02 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!UUID.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid token id" }, { status: 400 });
  }
  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const { fromChain, toChain, notes, confirm } = parsed.data;

  const allowed = ALLOWED_PROMOTIONS[fromChain as ChainId];
  if (!allowed.includes(toChain as ChainId)) {
    return NextResponse.json({
      error: `Promotion ${fromChain} -> ${toChain} not allowed`,
      allowed,
    }, { status: 400 });
  }

  const envBlock = checkForgeEnv();
  if (envBlock) return envBlock;

  const token = await prisma.managedToken.findUnique({ where: { id } });
  if (!token) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (token.status === "RETIRED") {
    return NextResponse.json({ error: "Token is RETIRED" }, { status: 409 });
  }

  const cf = checkMainnetConfirm(toChain as ChainId, "PROMOTE", token.symbol, confirm);
  if (cf) return cf;

  const source = await prisma.managedTokenDeployment.findUnique({
    where: { tokenId_chain: { tokenId: id, chain: fromChain as ChainId } },
  });
  if (!source) {
    return NextResponse.json({ error: `No deployment on ${fromChain}` }, { status: 404 });
  }
  if (source.status !== "DEPLOYED") {
    return NextResponse.json({ error: `Source deployment is ${source.status}` }, { status: 409 });
  }

  const target = await prisma.managedTokenDeployment.findUnique({
    where: { tokenId_chain: { tokenId: id, chain: toChain as ChainId } },
  });
  if (target) {
    return NextResponse.json({ error: `Deployment already exists on ${toChain}` }, { status: 409 });
  }

  const treasury = getTreasuryKeypair();
  const mintAuthority = Keypair.generate();
  const freezeAuthority = token.freezeOnDeploy ? mintAuthority : null;

  let mintAddress: string;
  let signature: string;
  try {
    const out = await createSplMint({
      chain: toChain as ChainId,
      decimals: token.decimals,
      payer: treasury,
      mintAuthority: mintAuthority.publicKey,
      freezeAuthority: freezeAuthority?.publicKey ?? null,
    });
    mintAddress = out.mintAddress;
    signature = out.signature;
  } catch (e: any) {
    await logAudit({
      tokenId: id,
      action: "PROMOTE_FAILED",
      actorUserId: admin.id,
      payload: { fromChain, toChain, error: String(e?.message || e) },
    });
    return NextResponse.json({ error: e?.message || "Mint creation failed" }, { status: 500 });
  }

  const cipher = encryptKEK(Buffer.from(mintAuthority.secretKey));
  const deployment = await prisma.managedTokenDeployment.create({
    data: {
      tokenId: id,
      chain: toChain as ChainId,
      mintAddress,
      mintAuthorityCipher: cipher,
      mintAuthorityPubkey: mintAuthority.publicKey.toBase58(),
      freezeAuthorityPubkey: freezeAuthority?.publicKey.toBase58() ?? null,
      status: "DEPLOYED",
      txCreate: signature,
      deployedAt: new Date(),
      deployedById: admin.id,
      notes: notes ?? `Promoted from ${fromChain} (${source.mintAddress})`,
    },
  });

  await logAudit({
    tokenId: id,
    deploymentId: deployment.id,
    action: "PROMOTE",
    actorUserId: admin.id,
    payload: {
      fromChain,
      toChain,
      sourceMintAddress: source.mintAddress,
      mintAddress,
      txCreate: signature,
    },
  });

  return NextResponse.json({
    ok: true,
    fromChain,
    toChain,
    sourceMintAddress: source.mintAddress,
    deployment: {
      id: deployment.id,
      chain: deployment.chain,
      mintAddress: deployment.mintAddress,
      mintAuthorityPubkey: deployment.mintAuthorityPubkey,
      status: deployment.status,
      txCreate: deployment.txCreate,
      deployedAt: deployment.deployedAt,
    },
  }, { status: 201 });
}

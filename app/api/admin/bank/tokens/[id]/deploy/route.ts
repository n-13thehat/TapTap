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
  chain: z.enum(ChainEnum),
  notes: z.string().trim().max(500).optional(),
  confirm: z.string().trim().max(120).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = await rateGate(req, "admin:bank:tokens:deploy", { capacity: 5, refillPerSec: 0.05 });
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
  const { chain, notes, confirm } = parsed.data;

  const envBlock = checkForgeEnv();
  if (envBlock) return envBlock;

  const token = await prisma.managedToken.findUnique({ where: { id } });
  if (!token) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (token.status === "RETIRED") {
    return NextResponse.json({ error: "Token is RETIRED" }, { status: 409 });
  }

  const cf = checkMainnetConfirm(chain as ChainId, "DEPLOY", token.symbol, confirm);
  if (cf) return cf;

  const existing = await prisma.managedTokenDeployment.findUnique({
    where: { tokenId_chain: { tokenId: id, chain: chain as ChainId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Deployment already exists for this chain" }, { status: 409 });
  }

  const treasury = getTreasuryKeypair();
  const mintAuthority = Keypair.generate();
  const freezeAuthority = token.freezeOnDeploy ? mintAuthority : null;

  let mintAddress: string;
  let signature: string;
  try {
    const out = await createSplMint({
      chain: chain as ChainId,
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
      action: "DEPLOY_FAILED",
      actorUserId: admin.id,
      payload: { chain, error: String(e?.message || e) },
    });
    return NextResponse.json({ error: e?.message || "Mint creation failed" }, { status: 500 });
  }

  const cipher = encryptKEK(Buffer.from(mintAuthority.secretKey));
  const deployment = await prisma.managedTokenDeployment.create({
    data: {
      tokenId: id,
      chain: chain as ChainId,
      mintAddress,
      mintAuthorityCipher: cipher,
      mintAuthorityPubkey: mintAuthority.publicKey.toBase58(),
      freezeAuthorityPubkey: freezeAuthority?.publicKey.toBase58() ?? null,
      status: "DEPLOYED",
      txCreate: signature,
      deployedAt: new Date(),
      deployedById: admin.id,
      notes: notes ?? null,
    },
  });

  if (token.status === "DRAFT") {
    await prisma.managedToken.update({ where: { id }, data: { status: "DEPLOYED" } });
  }

  await logAudit({
    tokenId: id,
    deploymentId: deployment.id,
    action: "DEPLOY",
    actorUserId: admin.id,
    payload: {
      chain,
      mintAddress,
      mintAuthorityPubkey: deployment.mintAuthorityPubkey,
      freezeAuthorityPubkey: deployment.freezeAuthorityPubkey,
      txCreate: signature,
    },
  });

  return NextResponse.json({
    ok: true,
    deployment: {
      id: deployment.id,
      tokenId: deployment.tokenId,
      chain: deployment.chain,
      mintAddress: deployment.mintAddress,
      mintAuthorityPubkey: deployment.mintAuthorityPubkey,
      freezeAuthorityPubkey: deployment.freezeAuthorityPubkey,
      status: deployment.status,
      txCreate: deployment.txCreate,
      deployedAt: deployment.deployedAt,
    },
  }, { status: 201 });
}

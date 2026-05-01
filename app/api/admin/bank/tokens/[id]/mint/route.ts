import { NextResponse } from "next/server";
import { z } from "zod";
import type { ChainId } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";
import { getTreasuryKeypair, isValidSolanaAddress } from "@/lib/solana";
import { mintToAddress } from "@/lib/solana/tokens";
import {
  ChainEnum,
  checkForgeEnv,
  checkMainnetConfirm,
  keypairFromCipher,
  logAudit,
} from "@/api/admin/bank/tokens/_lib/forge";

const UUID = z.string().uuid();
const Body = z.object({
  chain: z.enum(ChainEnum),
  recipient: z.string().trim().min(32).max(64),
  amount: z.string().regex(/^[0-9]+$/, "amount must be integer base units"),
  confirm: z.string().trim().max(120).optional(),
}).refine((v) => isValidSolanaAddress(v.recipient), { message: "Invalid recipient", path: ["recipient"] });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = await rateGate(req, "admin:bank:tokens:mint", { capacity: 10, refillPerSec: 0.1 });
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
  const { chain, recipient, amount, confirm } = parsed.data;

  const envBlock = checkForgeEnv();
  if (envBlock) return envBlock;

  const token = await prisma.managedToken.findUnique({ where: { id } });
  if (!token) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (token.status === "FROZEN" || token.status === "RETIRED") {
    return NextResponse.json({ error: `Token is ${token.status}` }, { status: 409 });
  }

  const cf = checkMainnetConfirm(chain as ChainId, "MINT", token.symbol, confirm);
  if (cf) return cf;

  const deployment = await prisma.managedTokenDeployment.findUnique({
    where: { tokenId_chain: { tokenId: id, chain: chain as ChainId } },
  });
  if (!deployment) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  if (deployment.status !== "DEPLOYED") {
    return NextResponse.json({ error: `Deployment is ${deployment.status}` }, { status: 409 });
  }
  if (!deployment.mintAuthorityCipher) {
    return NextResponse.json({ error: "Mint authority has been revoked" }, { status: 409 });
  }

  const amountBig = BigInt(amount);
  if (amountBig <= 0n) {
    return NextResponse.json({ error: "amount must be > 0" }, { status: 400 });
  }
  if (token.supplyCap != null) {
    const projected = deployment.supplyMinted + amountBig;
    if (projected > token.supplyCap) {
      return NextResponse.json({
        error: "Supply cap exceeded",
        cap: token.supplyCap.toString(),
        current: deployment.supplyMinted.toString(),
        requested: amount,
      }, { status: 409 });
    }
  }

  let signature: string;
  let ata: string;
  try {
    const treasury = getTreasuryKeypair();
    const mintAuth = keypairFromCipher(deployment.mintAuthorityCipher);
    const out = await mintToAddress({
      chain: chain as ChainId,
      mint: deployment.mintAddress,
      mintAuthority: mintAuth,
      recipient,
      amount: amountBig,
      payer: treasury,
    });
    signature = out.signature;
    ata = out.ata;
  } catch (e: any) {
    await logAudit({
      tokenId: id,
      deploymentId: deployment.id,
      action: "MINT_FAILED",
      actorUserId: admin.id,
      payload: { chain, recipient, amount, error: String(e?.message || e) },
    });
    return NextResponse.json({ error: e?.message || "Mint failed" }, { status: 500 });
  }

  const updated = await prisma.managedTokenDeployment.update({
    where: { id: deployment.id },
    data: { supplyMinted: { increment: amountBig } },
  });

  await logAudit({
    tokenId: id,
    deploymentId: deployment.id,
    action: "MINT",
    actorUserId: admin.id,
    payload: { chain, recipient, ata, amount, signature },
  });

  return NextResponse.json({
    ok: true,
    chain,
    mintAddress: deployment.mintAddress,
    recipient,
    ata,
    amount,
    signature,
    supplyMinted: updated.supplyMinted.toString(),
  });
}

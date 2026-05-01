import { NextResponse } from "next/server";
import { z } from "zod";
import type { ChainId } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";
import { getTreasuryKeypair } from "@/lib/solana";
import { revokeMintAuthority, revokeFreezeAuthority } from "@/lib/solana/tokens";
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
  authority: z.enum(["MINT", "FREEZE"]),
  confirm: z.string().trim().max(120).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = await rateGate(req, "admin:bank:tokens:revoke", { capacity: 5, refillPerSec: 0.05 });
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
  const { chain, authority, confirm } = parsed.data;

  const envBlock = checkForgeEnv();
  if (envBlock) return envBlock;

  const token = await prisma.managedToken.findUnique({ where: { id } });
  if (!token) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const cf = checkMainnetConfirm(chain as ChainId, `REVOKE_${authority}`, token.symbol, confirm);
  if (cf) return cf;

  const deployment = await prisma.managedTokenDeployment.findUnique({
    where: { tokenId_chain: { tokenId: id, chain: chain as ChainId } },
  });
  if (!deployment) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  if (deployment.status !== "DEPLOYED") {
    return NextResponse.json({ error: `Deployment is ${deployment.status}` }, { status: 409 });
  }
  if (!deployment.mintAuthorityCipher) {
    return NextResponse.json({ error: "Authority already revoked" }, { status: 409 });
  }
  if (authority === "FREEZE" && !deployment.freezeAuthorityPubkey) {
    return NextResponse.json({ error: "No freeze authority on this deployment" }, { status: 409 });
  }

  let signature: string;
  try {
    const treasury = getTreasuryKeypair();
    const authKeypair = keypairFromCipher(deployment.mintAuthorityCipher);
    const fn = authority === "MINT" ? revokeMintAuthority : revokeFreezeAuthority;
    const out = await fn({
      chain: chain as ChainId,
      mint: deployment.mintAddress,
      currentAuthority: authKeypair,
      payer: treasury,
    });
    signature = out.signature;
  } catch (e: any) {
    await logAudit({
      tokenId: id,
      deploymentId: deployment.id,
      action: `REVOKE_${authority}_FAILED`,
      actorUserId: admin.id,
      payload: { chain, error: String(e?.message || e) },
    });
    return NextResponse.json({ error: e?.message || "Revoke failed" }, { status: 500 });
  }

  const updateData: Record<string, unknown> = {};
  if (authority === "MINT") {
    updateData.mintAuthorityCipher = "";
    updateData.status = "FROZEN";
    updateData.txFreeze = signature;
  } else {
    updateData.freezeAuthorityPubkey = null;
  }
  const updated = await prisma.managedTokenDeployment.update({
    where: { id: deployment.id },
    data: updateData,
  });

  if (authority === "MINT") {
    const remaining = await prisma.managedTokenDeployment.count({
      where: { tokenId: id, status: "DEPLOYED" },
    });
    if (remaining === 0) {
      await prisma.managedToken.update({ where: { id }, data: { status: "FROZEN" } });
    }
  }

  await logAudit({
    tokenId: id,
    deploymentId: deployment.id,
    action: `REVOKE_${authority}`,
    actorUserId: admin.id,
    payload: { chain, mintAddress: deployment.mintAddress, signature },
  });

  return NextResponse.json({
    ok: true,
    chain,
    authority,
    signature,
    deployment: {
      id: updated.id,
      status: updated.status,
      freezeAuthorityPubkey: updated.freezeAuthorityPubkey,
      txFreeze: updated.txFreeze,
    },
  });
}

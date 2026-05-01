import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";

const UUID = z.string().uuid();
const AUDIT_LIMIT = 25;

function serializeBigInt(value: bigint | null | undefined): string | null {
  return value == null ? null : value.toString();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = await rateGate(req, "admin:bank:tokens:detail", { capacity: 30, refillPerSec: 0.5 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!UUID.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid token id" }, { status: 400 });
  }

  const token = await prisma.managedToken.findUnique({
    where: { id },
    include: {
      deployments: { orderBy: { chain: "asc" } },
      parent: { select: { id: true, name: true, symbol: true, kind: true } },
      children: {
        select: { id: true, name: true, symbol: true, kind: true, status: true },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { auditEvents: true } },
    },
  });
  if (!token) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const recentAuditEvents = await prisma.tokenAuditEvent.findMany({
    where: { tokenId: id },
    orderBy: { createdAt: "desc" },
    take: AUDIT_LIMIT,
    select: {
      id: true,
      action: true,
      actorUserId: true,
      deploymentId: true,
      payload: true,
      createdAt: true,
    },
  });

  const data = {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    description: token.description,
    kind: token.kind,
    parentTokenId: token.parentTokenId,
    parent: token.parent,
    status: token.status,
    decimals: token.decimals,
    supplyCap: serializeBigInt(token.supplyCap),
    holderCap: token.holderCap,
    freezeOnDeploy: token.freezeOnDeploy,
    metadataUri: token.metadataUri,
    createdById: token.createdById,
    createdAt: token.createdAt,
    updatedAt: token.updatedAt,
    children: token.children,
    auditEventCount: token._count.auditEvents,
    deployments: token.deployments.map((d) => ({
      id: d.id,
      tokenId: d.tokenId,
      chain: d.chain,
      mintAddress: d.mintAddress,
      mintAuthorityPubkey: d.mintAuthorityPubkey,
      freezeAuthorityPubkey: d.freezeAuthorityPubkey,
      status: d.status,
      supplyMinted: d.supplyMinted.toString(),
      txCreate: d.txCreate,
      txFreeze: d.txFreeze,
      deployedAt: d.deployedAt,
      deployedById: d.deployedById,
      notes: d.notes,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
    recentAuditEvents,
  };

  return NextResponse.json({ ok: true, token: data });
}

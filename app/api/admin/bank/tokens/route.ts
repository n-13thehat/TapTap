import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";

const Q = z.object({
  kind: z.enum(["ROOT", "LAYER", "PARTNER", "EXPERIMENTAL"]).optional(),
  status: z.enum(["DRAFT", "DEPLOYED", "FROZEN", "RETIRED"]).optional(),
  parentTokenId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

function serializeDeployment(d: {
  id: string;
  tokenId: string;
  chain: string;
  mintAddress: string;
  mintAuthorityPubkey: string;
  freezeAuthorityPubkey: string | null;
  status: string;
  supplyMinted: bigint;
  txCreate: string | null;
  txFreeze: string | null;
  deployedAt: Date | null;
  deployedById: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
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
  };
}

export async function GET(req: Request) {
  const rl = await rateGate(req, "admin:bank:tokens:list", { capacity: 30, refillPerSec: 0.5 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const qp = Q.safeParse(Object.fromEntries(url.searchParams));
  if (!qp.success) {
    return NextResponse.json({ error: "Invalid query", issues: qp.error.issues }, { status: 400 });
  }
  const { kind, status, parentTokenId, limit } = qp.data;

  const where: Record<string, unknown> = {};
  if (kind) where.kind = kind;
  if (status) where.status = status;
  if (parentTokenId === "null") where.parentTokenId = null;
  else if (parentTokenId) where.parentTokenId = parentTokenId;

  const tokens = await prisma.managedToken.findMany({
    where,
    take: limit ?? 100,
    orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
    include: {
      deployments: { orderBy: { chain: "asc" } },
      _count: { select: { children: true, auditEvents: true } },
    },
  });

  const data = tokens.map((t) => ({
    id: t.id,
    name: t.name,
    symbol: t.symbol,
    description: t.description,
    kind: t.kind,
    parentTokenId: t.parentTokenId,
    status: t.status,
    decimals: t.decimals,
    supplyCap: t.supplyCap == null ? null : t.supplyCap.toString(),
    holderCap: t.holderCap,
    freezeOnDeploy: t.freezeOnDeploy,
    metadataUri: t.metadataUri,
    createdById: t.createdById,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    childCount: t._count.children,
    auditEventCount: t._count.auditEvents,
    deployments: t.deployments.map(serializeDeployment),
  }));

  return NextResponse.json({ ok: true, count: data.length, tokens: data });
}

const Body = z.object({
  name: z.string().trim().min(1).max(64),
  symbol: z.string().trim().min(1).max(16).regex(/^[A-Z0-9]+$/, "uppercase A-Z / 0-9 only"),
  description: z.string().trim().max(500).optional(),
  kind: z.enum(["ROOT", "LAYER", "PARTNER", "EXPERIMENTAL"]),
  parentTokenId: z.string().uuid().optional(),
  decimals: z.number().int().min(0).max(9).optional(),
  supplyCap: z.string().regex(/^[0-9]+$/).optional(),
  holderCap: z.number().int().positive().optional(),
  freezeOnDeploy: z.boolean().optional(),
  metadataUri: z.string().trim().url().max(500).optional(),
});

export async function POST(req: Request) {
  const rl = await rateGate(req, "admin:bank:tokens:create", { capacity: 10, refillPerSec: 0.2 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const b = parsed.data;

  if (b.parentTokenId) {
    const parent = await prisma.managedToken.findUnique({ where: { id: b.parentTokenId } });
    if (!parent) return NextResponse.json({ error: "Parent token not found" }, { status: 404 });
    if (parent.kind === "EXPERIMENTAL") {
      return NextResponse.json({ error: "EXPERIMENTAL tokens cannot have children" }, { status: 400 });
    }
  }

  const dup = await prisma.managedToken.findFirst({ where: { symbol: b.symbol, kind: b.kind } });
  if (dup) return NextResponse.json({ error: "Token with that symbol+kind already exists" }, { status: 409 });

  const created = await prisma.managedToken.create({
    data: {
      name: b.name,
      symbol: b.symbol,
      description: b.description,
      kind: b.kind,
      parentTokenId: b.parentTokenId,
      decimals: b.decimals ?? 0,
      supplyCap: b.supplyCap == null ? null : BigInt(b.supplyCap),
      holderCap: b.holderCap,
      freezeOnDeploy: b.freezeOnDeploy ?? false,
      metadataUri: b.metadataUri,
      createdById: admin.id,
    },
  });

  await prisma.tokenAuditEvent.create({
    data: {
      tokenId: created.id,
      action: "CREATE",
      actorUserId: admin.id,
      payload: { name: b.name, symbol: b.symbol, kind: b.kind, parentTokenId: b.parentTokenId ?? null },
    },
  }).catch(() => null);

  return NextResponse.json({
    ok: true,
    token: {
      id: created.id,
      name: created.name,
      symbol: created.symbol,
      kind: created.kind,
      status: created.status,
      decimals: created.decimals,
      supplyCap: created.supplyCap == null ? null : created.supplyCap.toString(),
      parentTokenId: created.parentTokenId,
      createdAt: created.createdAt,
    },
  }, { status: 201 });
}

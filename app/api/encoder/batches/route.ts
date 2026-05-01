import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { generateTtidBatch } from "@/lib/encoder";

const MAX_BATCH_SIZE = 5000;

async function requireAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user || (user.role as any) !== "ADMIN") return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const batches = await prisma.chipBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { sku: true, _count: { select: { chips: true } } },
    take: 100,
  });
  return NextResponse.json({ batches });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const skuId = String(body?.skuId || "");
    const size = Number(body?.size || 0);
    if (!skuId || !Number.isInteger(size) || size <= 0 || size > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `skuId and 1<=size<=${MAX_BATCH_SIZE} required` },
        { status: 400 }
      );
    }

    const sku = await prisma.hardwareSku.findUnique({ where: { id: skuId } });
    if (!sku) return NextResponse.json({ error: "SKU not found" }, { status: 404 });

    const ttids = generateTtidBatch(size);
    const batch = await prisma.chipBatch.create({
      data: {
        skuId,
        size,
        notes: body?.notes ?? null,
        chips: {
          create: ttids.map((ttid) => ({ ttid })),
        },
      },
      include: { _count: { select: { chips: true } } },
    });

    return NextResponse.json({ batch, ttidCount: ttids.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}

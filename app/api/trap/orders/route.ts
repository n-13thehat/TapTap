import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

type Item = {
  skuId: string;
  quantity: number;
  payloadType?: "TRACK" | "ALBUM" | "PLAYLIST" | "VISUAL_ART" | "EXTERNAL_URL" | "CUSTOM";
  payloadId?: string;
};

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await prisma.creatorOrder.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { sku: true } } },
    take: 50,
  });
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const items = (Array.isArray(body?.items) ? body.items : []) as Item[];
    const cleaned = items
      .filter((i) => i?.skuId && Number.isInteger(i.quantity) && i.quantity > 0)
      .slice(0, 50);
    if (cleaned.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    const skus = await prisma.hardwareSku.findMany({
      where: { id: { in: cleaned.map((i) => i.skuId) }, active: true },
      select: { id: true, retailCents: true },
    });
    const skuMap = new Map<string, number>(
      skus.map((s) => [s.id, Number(s.retailCents)])
    );

    let total = 0;
    const itemRows = cleaned
      .map((i) => {
        const cents = skuMap.get(i.skuId);
        if (typeof cents !== "number") return null;
        total += cents * i.quantity;
        return {
          skuId: i.skuId,
          quantity: i.quantity,
          payloadType: (i.payloadType ?? null) as any,
          payloadId: i.payloadId ?? null,
          unitCostCents: cents,
        };
      })
      .filter(Boolean) as any[];

    if (itemRows.length === 0) {
      return NextResponse.json({ error: "no valid SKUs" }, { status: 400 });
    }

    const order = await prisma.creatorOrder.create({
      data: {
        creatorId: user.id,
        status: "SUBMITTED" as any,
        totalCents: total,
        shippingAddr: body?.shippingAddr ?? null,
        notes: body?.notes ?? null,
        items: { create: itemRows },
      },
      include: { items: true },
    });

    return NextResponse.json({ order });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}

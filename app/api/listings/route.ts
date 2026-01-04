import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

type ListingBody = {
  title?: string;
  desc?: string | null;
  priceCents?: number;
  currency?: "USD" | "TAP" | "SOL";
  inventory?: number;
  images?: any;
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = (session as any)?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = (await req.json()) as ListingBody;
    const title = String(body.title || "").trim();
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    const priceCents = Math.max(0, Math.floor(Number(body.priceCents || 0)));
    const inventory = Math.max(0, Math.floor(Number(body.inventory || 0)));
    const currency = (body.currency || "USD") as any;

    const product = await prisma.product.create({
      data: {
        ownerId: user.id,
        title,
        desc: body.desc || null,
        priceCents,
        currency,
        inventory,
        images: body.images ?? null,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, productId: product.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

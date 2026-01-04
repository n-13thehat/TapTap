import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

type DistBody = {
  type?: "MINI" | "HARD" | "SOFT";
  trackIds?: string[];
  notes?: string | null;
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = (session as any)?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = (await req.json()) as DistBody;
    const kind = body.type || "MINI";
    const tracks = Array.isArray(body.trackIds) ? body.trackIds.filter(Boolean) : [];
    if (!tracks.length) return NextResponse.json({ error: "trackIds required" }, { status: 400 });

    // Create an Order to track status of distribution request
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: "CREATED" as any,
        currency: "USD" as any,
        totalCents: 0,
        items: { type: kind, trackIds: tracks, notes: body.notes || null },
        provider: "STRIPE" as any,
      },
      select: { id: true, status: true },
    });

    // History log for auditing
    await prisma.history.create({
      data: {
        userId: user.id,
        targetType: "DISTRIBUTION",
        targetId: order.id,
        event: `REQUEST_${kind}`,
      },
    });

    return NextResponse.json({ ok: true, orderId: order.id, status: order.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

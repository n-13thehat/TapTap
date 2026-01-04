import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CaptureBody = { orderId?: string; providerOrderId?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CaptureBody;
    const orderId = String(body.orderId || "").trim();
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if ((order as any).status === "PAID") return NextResponse.json({ ok: true, orderId, status: order.status });

    // In real integration, call PayPal capture API here using providerOrderId
    // For now, mark as PAID and create a Transaction
    const tx = await prisma.transaction.create({
      data: { orderId: order.id, amount: order.totalCents, currency: order.currency as any, provider: "VENMO" as any, providerRef: body.providerOrderId ?? null },
    });
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" as any, providerRef: body.providerOrderId ?? null, provider: "VENMO" as any },
    });
    return NextResponse.json({ ok: true, orderId: order.id, status: updated.status, transactionId: tx.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

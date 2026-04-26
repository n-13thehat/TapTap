import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CaptureBody = z.object({
  orderId: z.string().trim().min(1).max(128),
  providerOrderId: z.string().trim().min(1).max(128).optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = CaptureBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
    }
    const { orderId, providerOrderId } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if ((order as any).status === "PAID") return NextResponse.json({ ok: true, orderId, status: order.status });

    // In real integration, call PayPal capture API here using providerOrderId
    // For now, mark as PAID and create a Transaction
    const tx = await prisma.transaction.create({
      data: { orderId: order.id, amount: order.totalCents, currency: order.currency as any, provider: "VENMO" as any, providerRef: providerOrderId ?? null },
    });
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" as any, providerRef: providerOrderId ?? null, provider: "VENMO" as any },
    });
    return NextResponse.json({ ok: true, orderId: order.id, status: updated.status, transactionId: tx.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

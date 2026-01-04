import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // For PayPal/Venmo webhooks. Verification omitted here; add transmission id/cert verify for production.
  try {
    const event = await req.json();
    const resource = event?.resource || {};
    const intent = resource?.intent || event?.event_type || "";
    const providerOrderId = resource?.id || null;
    const amountValue = Number(resource?.purchase_units?.[0]?.amount?.value || 0);
    const totalCents = Math.round(amountValue * 100);

    // Find the best matching local order by providerRef or amount
    let order = null as any;
    if (providerOrderId) order = await prisma.order.findFirst({ where: { providerRef: providerOrderId } });
    if (!order && totalCents > 0) order = await prisma.order.findFirst({ where: { totalCents, status: { not: "PAID" as any } } });
    if (!order) return NextResponse.json({ ok: true });

    if (String(intent).includes("CAPTURE") || event?.event_type === "CHECKOUT.ORDER.APPROVED") {
      await prisma.transaction.create({ data: { orderId: order.id, amount: order.totalCents, currency: order.currency as any } });
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" as any, providerRef: providerOrderId } });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const WebhookEvent = z.object({
  event_type: z.string().max(128).optional(),
  resource: z.object({
    id: z.string().max(128).optional(),
    intent: z.string().max(64).optional(),
    purchase_units: z.array(z.object({
      amount: z.object({ value: z.union([z.string(), z.number()]).optional() }).passthrough().optional(),
    }).passthrough()).optional(),
  }).passthrough().optional(),
}).passthrough();

export async function POST(req: Request) {
  // For PayPal/Venmo webhooks. Verification omitted here; add transmission id/cert verify for production.
  try {
    const raw = await req.json().catch(() => null);
    const parsed = WebhookEvent.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid webhook payload", issues: parsed.error.issues }, { status: 400 });
    }
    const event = parsed.data;
    const resource: any = event.resource || {};
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


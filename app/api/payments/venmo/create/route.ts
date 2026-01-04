import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateBody = {
  items: any;
  currency?: "USD";
  totalCents: number;
  idempotencyKey?: string;
};

async function createPaypalOrder(totalCents: number, currency: string) {
  const client = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const env = process.env.PAYPAL_ENV || "sandbox";
  if (!client || !secret) return { ok: false as const, approvalUrl: null, providerId: null };
  const base = env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${client}:${secret}`).toString("base64")}` },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!tokenRes.ok) throw new Error("paypal auth failed");
  const { access_token } = await tokenRes.json();

  const orderRes = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${access_token}` },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [ { amount: { currency_code: currency, value: (totalCents / 100).toFixed(2) } } ],
      payment_source: { venmo: {} },
    }),
  });
  const data = await orderRes.json();
  const approval = (data?.links || []).find((l: any) => l.rel === "approve")?.href || null;
  return { ok: true as const, approvalUrl: approval, providerId: data?.id || null };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateBody;
    const totalCents = Math.max(0, Math.floor(Number(body.totalCents || 0)));
    if (!totalCents) return NextResponse.json({ error: "totalCents required" }, { status: 400 });

    // Optional idempotency via Setting
    const idem = String(body.idempotencyKey || "").trim();
    if (idem) {
      const hit = await prisma.setting.findFirst({ where: { key: `venmo:idemp:${idem}` } });
      if (hit) return NextResponse.json({ ok: true, idempotent: true });
    }

    const order = await prisma.order.create({
      data: {
        userId: (null as any),
        status: "CREATED" as any,
        currency: "USD" as any,
        totalCents,
        provider: "VENMO" as any,
        items: { paymentProvider: "VENMO", items: body.items ?? null },
      },
      select: { id: true },
    });

    let approvalUrl: string | null = null;
    let providerId: string | null = null;
    try {
      const created = await createPaypalOrder(totalCents, "USD");
      approvalUrl = created.approvalUrl;
      providerId = created.providerId;
    } catch {
      approvalUrl = `venmo://pay?amount=${(totalCents/100).toFixed(2)}`;
    }

    if (idem) {
      await prisma.setting.upsert({
        where: { userId_key: { userId: order.id, key: `venmo:idemp:${idem}` } },
        update: { value: { orderId: order.id } as any },
        create: { userId: order.id, key: `venmo:idemp:${idem}`, value: { orderId: order.id } as any },
      });
    }

    return NextResponse.json({ ok: true, orderId: order.id, approvalUrl, providerId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

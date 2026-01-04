import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { usdCentsToTap } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, key };
}

type Body = {
  productId?: string;
  paymentMethod?: "venmo" | "direct" | "tap";
  items?: any;
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const { url, key } = env();
    const supabase = createClient(url, key);
    const body = (await req.json().catch(() => ({}))) as Body;
    const productId = String(body?.productId || "");
    const paymentMethod = (body?.paymentMethod || "direct") as Body["paymentMethod"];
    const userId = body?.userId;

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }

    // Look up product + price
    const { data: product, error: pErr } = await supabase
      .from("Product")
      .select("id, priceCents")
      .eq("id", productId)
      .single();

    if (pErr || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const amountCents = Number(product.priceCents || 0);
    const itemPayload = { productId, priceCents: amountCents, items: body?.items ?? null };

    // Handle TAP token payment
    if (paymentMethod === "tap") {
      if (!userId) {
        return NextResponse.json({ error: "userId required for TAP payment" }, { status: 400 });
      }

      try {
        // Convert USD cents to TAP tokens
        const tapAmount = await usdCentsToTap(amountCents);

        // Check user's TAP balance
        const userBalance = await prisma.tapCoinTransaction.aggregate({
          where: { userId },
          _sum: { amount: true },
        });

        const currentBalance = userBalance._sum.amount || 0;
        if (currentBalance < tapAmount) {
          return NextResponse.json({
            error: "Insufficient TAP balance",
            required: tapAmount,
            available: currentBalance
          }, { status: 400 });
        }

        // Create debit transaction for the purchase
        const transaction = await prisma.tapCoinTransaction.create({
          data: {
            userId,
            amount: -tapAmount, // Negative for debit
            type: "MARKETPLACE_PURCHASE",
            description: `Marketplace purchase: ${productId}`,
            metadata: {
              productId,
              priceCents: amountCents,
              tapAmount,
              paymentMethod: "tap",
            },
          },
        });

        return NextResponse.json({
          ok: true,
          transactionId: transaction.id,
          paymentMethod: "tap",
          tapAmount,
          usdCents: amountCents,
        });
      } catch (error: any) {
        console.error("TAP payment error:", error);
        return NextResponse.json({
          error: "TAP payment failed",
          details: error.message
        }, { status: 500 });
      }
    }

    // Try Order -> Purchase -> Transaction (whichever table exists under your schema)
    const tables = ["Order", "Purchase", "Transaction"];
    let inserted: { id: string } | null = null;
    let lastError: string | null = null;

    for (const t of tables) {
      const { data, error } = await supabase
        .from(t)
        .insert([{ productId, amountCents }])
        .select("id")
        .single();

      if (!error && data) { inserted = data as any; break; }
      lastError = error?.message || `Insert into ${t} failed`;
    }

    if (!inserted) {
      return NextResponse.json({ error: lastError || "Insert failed" }, { status: 500 });
    }

    if (paymentMethod === "venmo") {
      const venmoReq = await fetch(new URL("/api/payments/venmo/create", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemPayload,
          currency: "USD",
          totalCents: amountCents,
          idempotencyKey: inserted.id,
        }),
      }).catch(() => null);
      const venmoJson = venmoReq && venmoReq.ok ? await venmoReq.json() : null;
      if (!venmoJson?.ok) {
        return NextResponse.json({ error: "venmo init failed", detail: venmoJson }, { status: 502 });
      }
      return NextResponse.json({
        ok: true,
        transactionId: inserted.id,
        paymentMethod: "venmo",
        approvalUrl: venmoJson.approvalUrl,
        providerId: venmoJson.providerId,
      });
    }

    return NextResponse.json({ ok: true, transactionId: inserted.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "buy failed" }, { status: 500 });
  }
}

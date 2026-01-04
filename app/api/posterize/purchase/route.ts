import { NextRequest, NextResponse } from "next/server";
import { dbPurchasePosterizeItem } from "@/lib/server/persistence";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    itemId?: string;
    qty?: number;
    buyerEmail?: string;
  } | null;

  const itemId = body?.itemId;
  const qty = Number(body?.qty ?? 1);

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  try {
    const result = await dbPurchasePosterizeItem({
      itemId,
      qty,
      buyerEmail: body?.buyerEmail,
    });
    return NextResponse.json({ ok: true, purchase: result.purchase, remaining: result.remaining });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Purchase failed" }, { status: 400 });
  }
}

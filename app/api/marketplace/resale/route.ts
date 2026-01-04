import { NextResponse } from "next/server";
import { z } from "zod";
import { rateGate } from "@/api/_lib/rate";
import { applyTapTaxTransfer } from "@/lib/tax";

// Resale of owned content using TapCoin with 9% TapTax (6% Treasury, 3% Burn)
const ResaleSchema = z.object({
  sellerUserId: z.string().uuid(),
  buyerUserId: z.string().uuid(),
  tapAmount: z.number().int().positive(),
  productId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const rl = await rateGate(req, "market:resale", { capacity: 10, refillPerSec: 0.1 });
    if (rl) return rl;

    const parsed = ResaleSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
    const { sellerUserId, buyerUserId, tapAmount } = parsed.data;

    await applyTapTaxTransfer({ fromUserId: buyerUserId, toUserId: sellerUserId, amount: tapAmount, reason: "RESALE" });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}


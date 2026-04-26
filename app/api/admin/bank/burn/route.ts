import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";
import { getTreasuryKeypair, burnTapFrom } from "@/lib/solana";

const Body = z.object({
  amount: z.number().int().positive().max(1_000_000_000),
  note: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  const rl = await rateGate(req, "admin:bank:burn", { capacity: 5, refillPerSec: 0.1 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const { amount, note } = parsed.data;

  if (!process.env.TREASURY_WALLET_SECRET) {
    return NextResponse.json({ error: "TREASURY_WALLET_SECRET not configured" }, { status: 503 });
  }
  if (!process.env.TAP_MINT_ADDRESS) {
    return NextResponse.json({ error: "TAP_MINT_ADDRESS not configured" }, { status: 503 });
  }

  try {
    const treasury = getTreasuryKeypair();
    const signature = await burnTapFrom(treasury, amount);

    await (prisma as any).distribution.create({
      data: {
        type: "BURN",
        amount,
        note: `onchain sig=${signature}${note ? ` ${note}` : ""}`,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, amount, signature, fromAddress: treasury.publicKey.toBase58() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Burn failed" }, { status: 500 });
  }
}

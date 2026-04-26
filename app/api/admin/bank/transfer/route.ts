import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";
import { getTreasuryKeypair, transferSolFrom, transferTapFrom, isValidSolanaAddress } from "@/lib/solana";

const Body = z.object({
  kind: z.enum(["SOL", "TAP"]),
  toAddress: z.string().trim().min(32).max(64),
  amount: z.number().positive().finite().max(1_000_000_000),
  note: z.string().trim().max(500).optional(),
}).refine((v) => isValidSolanaAddress(v.toAddress), { message: "Invalid toAddress", path: ["toAddress"] });

export async function POST(req: Request) {
  const rl = await rateGate(req, "admin:bank:transfer", { capacity: 5, refillPerSec: 0.1 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const { kind, toAddress, amount, note } = parsed.data;

  if (!process.env.TREASURY_WALLET_SECRET) {
    return NextResponse.json({ error: "TREASURY_WALLET_SECRET not configured" }, { status: 503 });
  }

  try {
    const treasury = getTreasuryKeypair();
    const fromAddress = treasury.publicKey.toBase58();

    let signature: string;
    if (kind === "SOL") {
      signature = await transferSolFrom(treasury, toAddress, amount);
    } else {
      signature = await transferTapFrom(treasury, toAddress, Math.floor(amount));
    }

    await (prisma as any).distribution.create({
      data: {
        type: kind === "SOL" ? "TREASURY_SOL_TRANSFER" : "TREASURY_TAP_TRANSFER",
        amount: Math.floor(amount),
        note: `to=${toAddress} sig=${signature}${note ? ` ${note}` : ""}`,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, kind, fromAddress, toAddress, amount, signature });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Transfer failed" }, { status: 500 });
  }
}

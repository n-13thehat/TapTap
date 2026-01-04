import { prisma as prismaClient } from "@/lib/prisma";

export type TapTaxBreakdown = {
  tax: number;
  treasury: number;
  burn: number;
};

export function computeTapTax(amount: number): TapTaxBreakdown {
  const a = Math.max(0, Math.floor(Number(amount || 0)));
  // Percentages based on total amount
  const treasury = Math.floor(a * 0.06);
  const burn = Math.floor(a * 0.03);
  const tax = treasury + burn; // 9%
  return { tax, treasury, burn };
}

export type ApplyTaxArgs = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  reason?: string;
  // Optional override of prisma for tests; defaults to shared client
  prisma?: typeof prismaClient;
};

/**
 * Applies TapTax (9%: 6% Treasury, 3% Burn) on a non-tip transfer.
 * - Sender is debited full `amount`.
 * - Recipient receives `amount - tax`.
 * - Treasury optionally credited if TREASURY_WALLET_ADDRESS (+ TREASURY_USER_ID) provided.
 * - Burn is implicit (removed from circulation), and logged via TaxEvent/Distribution when available.
 */
export async function applyTapTaxTransfer(args: ApplyTaxArgs) {
  const { fromUserId, toUserId, amount, reason } = args;
  const prisma = (args.prisma as any) || (prismaClient as any);

  const isTip = String(reason || "").toUpperCase() === "TIP";
  const enforce = String(process.env.TAPTAX_ENFORCE || "true").toLowerCase() !== "false";

  // If tip or disabled, do a full transfer with no tax.
  if (!enforce || isTip) {
    await prisma.$transaction([
      prisma.tapCoinTransaction.create({ data: { userId: fromUserId, amount: -amount, reason: reason || "SEND" } }),
      prisma.tapCoinTransaction.create({ data: { userId: toUserId, amount, reason: reason || "RECEIVE" } }),
    ]);
    return { taxApplied: false } as const;
  }

  const { tax, treasury, burn } = computeTapTax(amount);
  const netToRecipient = Math.max(0, amount - tax);

  const ops: any[] = [];
  ops.push(
    prisma.tapCoinTransaction.create({ data: { userId: fromUserId, amount: -amount, reason: reason || "SEND" } })
  );
  ops.push(
    prisma.tapCoinTransaction.create({ data: { userId: toUserId, amount: netToRecipient, reason: reason || "RECEIVE" } })
  );

  // Optionally credit Treasury wallet if envs provided
  const treasuryAddr = process.env.TREASURY_WALLET_ADDRESS;
  const treasuryUserId = process.env.TREASURY_USER_ID; // optional link to a system user
  if (treasuryAddr && treasuryUserId && treasury > 0) {
    ops.push(
      prisma.wallet
        .upsert({
          where: { address: treasuryAddr },
          update: { userId: treasuryUserId },
          create: { address: treasuryAddr, userId: treasuryUserId, provider: "SOLANA" },
        })
        .then((w: any) =>
          prisma.tapCoinTransaction.create({
            data: { userId: treasuryUserId, walletId: w.id, amount: treasury, reason: "TAPTAX_TREASURY" },
          })
        )
    );
  }

  // Optional logging tables if present (guarded for tests/mocks)
  if (prisma.taxEvent?.create) {
    ops.push(
      prisma.taxEvent.create({
        data: {
          fromUserId,
          toUserId,
          amount,
          tax,
          burn,
          treasury,
          reason: reason || "TRANSFER",
        },
      })
    );
  }
  if (prisma.distribution?.create) {
    if (treasury > 0) {
      ops.push(
        prisma.distribution.create({ data: { type: "TREASURY", amount: treasury, note: "6% TapTax to Treasury" } })
      );
    }
    if (burn > 0) {
      ops.push(
        prisma.distribution.create({ data: { type: "BURN", amount: burn, note: "3% TapTax burned" } })
      );
    }
  }

  await prisma.$transaction(ops);
  return { taxApplied: true, tax, treasury, burn, netToRecipient } as const;
}


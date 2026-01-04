import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CalculateFeeSchema = z.object({
  transactionType: z.enum(['TRANSFER', 'TRADE', 'STAKE', 'BRIDGE', 'WITHDRAWAL', 'PREMIUM']),
  amount: z.number().min(1),
  targetUserId: z.string().uuid().optional(), // For transfers
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { transactionType, amount, targetUserId } = CalculateFeeSchema.parse(body);

    // Get appropriate fee structure
    const feeStructure = await prisma.feeStructure.findFirst({
      where: { 
        feeType: `${transactionType}_FEE` as any,
        isActive: true 
      }
    });

    if (!feeStructure) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    }

    // Get user details for tier calculation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        createdAt: true,
        _count: {
          select: {
            tapCoinTransactions: { where: { amount: { gt: 0 } } }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate user tier
    const userTier = calculateUserTier(user);

    // Get current network congestion
    const congestionLevel = await getCurrentCongestionLevel();

    // Calculate user's recent volume (last 30 days)
    const recentVolume = await prisma.tapCoinTransaction.aggregate({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        amount: { gt: 0 }
      },
      _sum: { amount: true }
    });

    const monthlyVolume = recentVolume._sum.amount || 0;

    // Calculate fee components
    const feeCalculation = calculateDynamicFee({
      amount,
      baseRate: feeStructure.baseRate,
      minFee: feeStructure.minFee,
      maxFee: feeStructure.maxFee,
      userTier,
      congestionLevel,
      monthlyVolume,
      tierMultipliers: feeStructure.tierMultipliers,
      congestionMultipliers: feeStructure.congestionMultipliers,
      volumeDiscounts: feeStructure.volumeDiscounts,
    });

    // Record fee application
    await prisma.feeApplication.create({
      data: {
        structureId: feeStructure.id,
        userId: session.user.id,
        transactionType,
        baseAmount: amount,
        feeAmount: feeCalculation.finalFee,
        effectiveRate: feeCalculation.effectiveRate,
        tierDiscount: feeCalculation.tierDiscount,
        volumeDiscount: feeCalculation.volumeDiscount,
        congestionMultiplier: feeCalculation.congestionMultiplier,
      }
    });

    return NextResponse.json({
      feeCalculation: {
        ...feeCalculation,
        transactionType,
        amount,
        userTier,
        congestionLevel,
        monthlyVolume
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get fee history for user
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const transactionType = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const where: any = { userId: session.user.id };
    if (transactionType) where.transactionType = transactionType;

    const feeHistory = await prisma.feeApplication.findMany({
      where,
      include: {
        structure: {
          select: {
            name: true,
            feeType: true
          }
        }
      },
      orderBy: { appliedAt: 'desc' },
      take: limit
    });

    // Calculate summary stats
    const totalFeesPaid = feeHistory.reduce((sum, fee) => sum + fee.feeAmount, 0);
    const avgEffectiveRate = feeHistory.length > 0 
      ? feeHistory.reduce((sum, fee) => sum + fee.effectiveRate, 0) / feeHistory.length 
      : 0;

    const feesByType = feeHistory.reduce((acc, fee) => {
      acc[fee.transactionType] = (acc[fee.transactionType] || 0) + fee.feeAmount;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      feeHistory,
      summary: {
        totalFeesPaid,
        avgEffectiveRate,
        totalTransactions: feeHistory.length,
        feesByType
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Calculate user tier based on activity and role
function calculateUserTier(user: any): string {
  if (user.role === 'ADMIN') return 'PLATINUM';
  if (user.role === 'CREATOR') return 'GOLD';
  
  const accountAgeInDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const transactionCount = user._count.tapCoinTransactions;
  
  if (accountAgeInDays >= 365 && transactionCount >= 1000) return 'PLATINUM';
  if (accountAgeInDays >= 180 && transactionCount >= 500) return 'GOLD';
  if (accountAgeInDays >= 90 && transactionCount >= 100) return 'SILVER';
  if (accountAgeInDays >= 30 && transactionCount >= 10) return 'BRONZE';
  
  return 'BASIC';
}

// Get current network congestion level
async function getCurrentCongestionLevel(): Promise<string> {
  const recentMetrics = await prisma.networkMetrics.findFirst({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  return recentMetrics?.congestionLevel || 'LOW';
}

// Calculate dynamic fee with all modifiers
function calculateDynamicFee(params: {
  amount: number;
  baseRate: number;
  minFee: number;
  maxFee: number;
  userTier: string;
  congestionLevel: string;
  monthlyVolume: number;
  tierMultipliers: any;
  congestionMultipliers: any;
  volumeDiscounts: any;
}) {
  const {
    amount,
    baseRate,
    minFee,
    maxFee,
    userTier,
    congestionLevel,
    monthlyVolume,
    tierMultipliers,
    congestionMultipliers,
    volumeDiscounts
  } = params;

  // Calculate base fee
  let baseFee = Math.floor(amount * baseRate);

  // Apply tier discount
  const tierDiscount = (tierMultipliers as any)[userTier] || 1.0;
  const tierAdjustedFee = baseFee * tierDiscount;

  // Apply volume discount
  let volumeDiscount = 0;
  if (monthlyVolume >= 1000000) volumeDiscount = 0.5;      // 50% off for 1M+ volume
  else if (monthlyVolume >= 500000) volumeDiscount = 0.3;  // 30% off for 500K+ volume
  else if (monthlyVolume >= 100000) volumeDiscount = 0.2;  // 20% off for 100K+ volume
  else if (monthlyVolume >= 50000) volumeDiscount = 0.1;   // 10% off for 50K+ volume

  const volumeAdjustedFee = tierAdjustedFee * (1 - volumeDiscount);

  // Apply congestion multiplier
  const congestionMultiplier = (congestionMultipliers as any)[congestionLevel] || 1.0;
  const congestionAdjustedFee = volumeAdjustedFee * congestionMultiplier;

  // Apply min/max limits
  const finalFee = Math.max(minFee, Math.min(maxFee, Math.floor(congestionAdjustedFee)));

  // Calculate effective rate
  const effectiveRate = finalFee / amount;

  return {
    baseFee,
    tierDiscount: 1 - tierDiscount,
    volumeDiscount,
    congestionMultiplier,
    finalFee,
    effectiveRate,
    savings: baseFee - finalFee
  };
}

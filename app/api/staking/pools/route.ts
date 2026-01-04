import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const StakeSchema = z.object({
  poolId: z.string().uuid(),
  amount: z.number().min(1),
});

// Get all staking pools
export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const poolType = url.searchParams.get('type');

    const where: any = { isActive: true };
    if (poolType) where.poolType = poolType;

    const pools = await prisma.stakingPool.findMany({
      where,
      include: {
        _count: {
          select: { stakes: { where: { status: 'ACTIVE' } } }
        },
        ...(session?.user?.id && {
          stakes: {
            where: { 
              userId: session.user.id,
              status: 'ACTIVE'
            },
            select: {
              id: true,
              amount: true,
              stakedAt: true,
              lockEndsAt: true,
              rewardsClaimed: true
            }
          }
        })
      },
      orderBy: { apy: 'desc' }
    });

    // Calculate estimated rewards for each pool
    const poolsWithEstimates = pools.map(pool => {
      const userStake = session?.user?.id ? pool.stakes?.[0] : null;
      let estimatedDailyReward = 0;
      let estimatedYearlyReward = 0;

      if (userStake) {
        const dailyRate = pool.apy / 365 / 100;
        estimatedDailyReward = Math.floor(userStake.amount * dailyRate);
        estimatedYearlyReward = Math.floor(userStake.amount * (pool.apy / 100));
      }

      return {
        ...pool,
        userStake,
        estimatedDailyReward,
        estimatedYearlyReward,
        totalActiveStakers: pool._count.stakes
      };
    });

    return NextResponse.json({ pools: poolsWithEstimates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Stake tokens in a pool
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { poolId, amount } = StakeSchema.parse(body);

    // Get pool details
    const pool = await prisma.stakingPool.findUnique({
      where: { id: poolId, isActive: true }
    });

    if (!pool) {
      return NextResponse.json({ error: "Pool not found or inactive" }, { status: 404 });
    }

    // Validate stake amount
    if (amount < pool.minStakeAmount) {
      return NextResponse.json({ 
        error: `Minimum stake amount is ${pool.minStakeAmount} TAP` 
      }, { status: 400 });
    }

    if (pool.maxStakeAmount && amount > pool.maxStakeAmount) {
      return NextResponse.json({ 
        error: `Maximum stake amount is ${pool.maxStakeAmount} TAP` 
      }, { status: 400 });
    }

    // Check user balance
    const userBalance = await prisma.tapCoinTransaction.aggregate({
      where: { userId: session.user.id },
      _sum: { amount: true }
    });

    const balance = userBalance._sum.amount || 0;
    if (balance < amount) {
      return NextResponse.json({ 
        error: "Insufficient TAP balance",
        required: amount,
        available: balance
      }, { status: 400 });
    }

    // Calculate lock end date
    const lockEndsAt = new Date();
    lockEndsAt.setDate(lockEndsAt.getDate() + pool.lockPeriodDays);

    // Create stake and debit user balance in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stake record
      const stake = await tx.stake.create({
        data: {
          userId: session.user.id,
          poolId,
          amount,
          lockEndsAt,
        },
        include: {
          pool: true
        }
      });

      // Debit user balance
      await tx.tapCoinTransaction.create({
        data: {
          userId: session.user.id,
          amount: -amount,
          reason: `STAKE_${pool.name.toUpperCase().replace(/\s+/g, '_')}`
        }
      });

      // Update pool total
      await tx.stakingPool.update({
        where: { id: poolId },
        data: { totalStaked: { increment: amount } }
      });

      return stake;
    });

    return NextResponse.json({ stake: result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

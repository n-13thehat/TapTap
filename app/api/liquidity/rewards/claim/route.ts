import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ClaimLiquidityRewardsSchema = z.object({
  positionId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { positionId } = ClaimLiquidityRewardsSchema.parse(body);

    // Get liquidity position with pool details
    const position = await prisma.liquidityPosition.findUnique({
      where: { 
        id: positionId,
        userId: session.user.id
      },
      include: {
        pool: true,
        rewards: {
          where: { claimedAt: null }
        }
      }
    });

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    const now = new Date();
    const pool = position.pool;

    // Calculate pending rewards
    const timeSinceLastClaim = Math.max(0, now.getTime() - position.lastClaimTime.getTime());
    const secondsSinceLastClaim = timeSinceLastClaim / 1000;
    
    // Calculate user's share of the pool
    const userShare = Number(position.lpTokenAmount) / Number(pool.totalLiquidity);
    
    // Calculate rewards based on time elapsed and reward rate
    const baseRewards = Math.floor(pool.rewardRate * secondsSinceLastClaim * userShare);
    
    // Apply any bonus multipliers (simplified - could be based on lock time, NFTs, etc.)
    let bonusMultiplier = 1.0;
    const positionAgeInDays = (now.getTime() - position.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Loyalty bonus: +10% for positions older than 30 days
    if (positionAgeInDays >= 30) {
      bonusMultiplier += 0.1;
    }
    
    // Large position bonus: +5% for positions > 1% of pool
    if (userShare > 0.01) {
      bonusMultiplier += 0.05;
    }

    const totalRewards = Math.floor(baseRewards * bonusMultiplier);

    if (totalRewards <= 0) {
      return NextResponse.json({ error: "No rewards to claim" }, { status: 400 });
    }

    // Claim rewards in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create reward record
      const reward = await tx.liquidityReward.create({
        data: {
          userId: session.user.id,
          poolId: position.poolId,
          positionId,
          amount: totalRewards,
          rewardType: 'MINING_REWARD',
          claimedAt: now,
        }
      });

      // Credit user balance
      await tx.tapCoinTransaction.create({
        data: {
          userId: session.user.id,
          amount: totalRewards,
          reason: `LIQUIDITY_MINING_${pool.name.toUpperCase().replace(/\s+/g, '_')}`
        }
      });

      // Update position last claim time and reward debt
      await tx.liquidityPosition.update({
        where: { id: positionId },
        data: { 
          lastClaimTime: now,
          rewardDebt: { increment: totalRewards }
        }
      });

      // Update pool total rewards distributed
      await tx.liquidityPool.update({
        where: { id: position.poolId },
        data: { totalRewards: { increment: totalRewards } }
      });

      return reward;
    });

    return NextResponse.json({ 
      reward: result,
      amount: totalRewards,
      baseRewards,
      bonusMultiplier,
      message: `Successfully claimed ${totalRewards} TAP rewards`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get pending rewards for a position
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const positionId = url.searchParams.get('positionId');

    if (!positionId) {
      return NextResponse.json({ error: "positionId required" }, { status: 400 });
    }

    const position = await prisma.liquidityPosition.findUnique({
      where: { 
        id: positionId,
        userId: session.user.id
      },
      include: {
        pool: true
      }
    });

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    const now = new Date();
    const pool = position.pool;

    // Calculate pending rewards
    const timeSinceLastClaim = Math.max(0, now.getTime() - position.lastClaimTime.getTime());
    const secondsSinceLastClaim = timeSinceLastClaim / 1000;
    const userShare = Number(position.lpTokenAmount) / Number(pool.totalLiquidity);
    const baseRewards = Math.floor(pool.rewardRate * secondsSinceLastClaim * userShare);
    
    // Calculate bonus multiplier
    let bonusMultiplier = 1.0;
    const positionAgeInDays = (now.getTime() - position.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (positionAgeInDays >= 30) bonusMultiplier += 0.1;
    if (userShare > 0.01) bonusMultiplier += 0.05;

    const totalPendingRewards = Math.floor(baseRewards * bonusMultiplier);
    const dailyRewardRate = Math.floor(pool.rewardRate * 86400 * userShare);

    return NextResponse.json({
      positionId,
      pendingRewards: totalPendingRewards,
      baseRewards,
      bonusMultiplier,
      dailyRewardRate,
      userShare: userShare * 100, // as percentage
      poolShare: Number(position.lpTokenAmount),
      totalPoolLiquidity: Number(pool.totalLiquidity),
      lastClaimTime: position.lastClaimTime,
      canClaim: totalPendingRewards > 0,
      positionAgeInDays: Math.floor(positionAgeInDays)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

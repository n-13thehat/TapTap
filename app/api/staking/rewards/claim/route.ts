import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ClaimSchema = z.object({
  stakeId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { stakeId } = ClaimSchema.parse(body);

    // Get stake with unclaimed rewards
    const stake = await prisma.stake.findUnique({
      where: { 
        id: stakeId,
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        pool: true,
        rewards: {
          where: { claimedAt: null }
        }
      }
    });

    if (!stake) {
      return NextResponse.json({ error: "Stake not found" }, { status: 404 });
    }

    // Calculate pending rewards
    const now = new Date();
    const stakeAgeInDays = Math.floor((now.getTime() - stake.stakedAt.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = stake.pool.apy / 365 / 100;
    const totalEarnedRewards = Math.floor(stake.amount * dailyRate * stakeAgeInDays);
    const pendingRewards = totalEarnedRewards - stake.rewardsClaimed;

    if (pendingRewards <= 0) {
      return NextResponse.json({ error: "No rewards to claim" }, { status: 400 });
    }

    // Claim rewards in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create reward record
      const reward = await tx.stakingReward.create({
        data: {
          stakeId,
          poolId: stake.poolId,
          userId: session.user.id,
          amount: pendingRewards,
          rewardType: 'STAKING_YIELD',
          claimedAt: now,
        }
      });

      // Credit user balance
      await tx.tapCoinTransaction.create({
        data: {
          userId: session.user.id,
          amount: pendingRewards,
          reason: `STAKING_REWARD_${stake.pool.name.toUpperCase().replace(/\s+/g, '_')}`
        }
      });

      // Update stake rewards claimed
      await tx.stake.update({
        where: { id: stakeId },
        data: { rewardsClaimed: { increment: pendingRewards } }
      });

      // Update pool total rewards
      await tx.stakingPool.update({
        where: { id: stake.poolId },
        data: { totalRewards: { increment: pendingRewards } }
      });

      return reward;
    });

    return NextResponse.json({ 
      reward: result,
      amount: pendingRewards,
      message: `Successfully claimed ${pendingRewards} TAP rewards`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get claimable rewards for a stake
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const stakeId = url.searchParams.get('stakeId');

    if (!stakeId) {
      return NextResponse.json({ error: "stakeId required" }, { status: 400 });
    }

    const stake = await prisma.stake.findUnique({
      where: { 
        id: stakeId,
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        pool: true
      }
    });

    if (!stake) {
      return NextResponse.json({ error: "Stake not found" }, { status: 404 });
    }

    // Calculate pending rewards
    const now = new Date();
    const stakeAgeInDays = Math.floor((now.getTime() - stake.stakedAt.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = stake.pool.apy / 365 / 100;
    const totalEarnedRewards = Math.floor(stake.amount * dailyRate * stakeAgeInDays);
    const pendingRewards = Math.max(0, totalEarnedRewards - stake.rewardsClaimed);

    // Calculate next reward time (daily rewards)
    const lastClaimTime = stake.stakedAt;
    const nextRewardTime = new Date(lastClaimTime);
    nextRewardTime.setDate(nextRewardTime.getDate() + stakeAgeInDays + 1);

    return NextResponse.json({
      stakeId,
      pendingRewards,
      totalEarnedRewards,
      rewardsClaimed: stake.rewardsClaimed,
      dailyRewardRate: Math.floor(stake.amount * dailyRate),
      nextRewardTime,
      canClaim: pendingRewards > 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

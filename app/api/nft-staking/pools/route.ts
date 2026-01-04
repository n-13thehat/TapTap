import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const StakeNFTSchema = z.object({
  poolId: z.string().uuid(),
  nftId: z.string().min(1),
  nftMetadata: z.object({
    name: z.string(),
    image: z.string().url().optional(),
    attributes: z.array(z.object({
      trait_type: z.string(),
      value: z.union([z.string(), z.number()])
    })).optional(),
    rarity: z.string().optional(),
  }),
  stakingPeriod: z.number().min(1).optional(), // Days
});

// Get NFT staking pools
export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const stakingType = url.searchParams.get('type');

    const where: any = { isActive: true };
    if (stakingType) where.stakingType = stakingType;

    const pools = await prisma.nFTStakingPool.findMany({
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
            include: {
              rewards: {
                where: { claimedAt: null }
              }
            }
          }
        })
      },
      orderBy: { baseRewardRate: 'desc' }
    });

    // Calculate pool metrics and user data
    const poolsWithMetrics = pools.map(pool => {
      const userStakes = session?.user?.id ? pool.stakes || [] : [];
      const totalUserStaked = userStakes.length;
      const totalPendingRewards = userStakes.reduce((sum, stake) => 
        sum + stake.rewards.reduce((rewardSum, reward) => rewardSum + reward.amount, 0), 0
      );

      // Calculate estimated daily rewards for user's stakes
      const estimatedDailyRewards = userStakes.reduce((sum, stake) => {
        const baseDaily = pool.baseRewardRate * stake.stakingMultiplier;
        return sum + baseDaily;
      }, 0);

      return {
        ...pool,
        totalActiveStakers: pool._count.stakes,
        userStakes: userStakes.map(stake => ({
          ...stake,
          estimatedDailyReward: pool.baseRewardRate * stake.stakingMultiplier,
          daysStaked: Math.floor((Date.now() - stake.stakedAt.getTime()) / (1000 * 60 * 60 * 24)),
          canUnstake: !stake.lockEndsAt || new Date() >= stake.lockEndsAt
        })),
        userStats: {
          totalStaked: totalUserStaked,
          pendingRewards: totalPendingRewards,
          estimatedDailyRewards
        }
      };
    });

    return NextResponse.json({ pools: poolsWithMetrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Stake NFT in a pool
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { poolId, nftId, nftMetadata, stakingPeriod } = StakeNFTSchema.parse(body);

    // Get pool details
    const pool = await prisma.nFTStakingPool.findUnique({
      where: { id: poolId, isActive: true }
    });

    if (!pool) {
      return NextResponse.json({ error: "Pool not found or inactive" }, { status: 404 });
    }

    // Check if NFT is already staked
    const existingStake = await prisma.nFTStake.findUnique({
      where: { 
        nftId_poolId: { 
          nftId, 
          poolId 
        } 
      }
    });

    if (existingStake) {
      return NextResponse.json({ error: "NFT is already staked in this pool" }, { status: 400 });
    }

    // Validate staking period
    if (stakingPeriod && stakingPeriod < pool.minStakingPeriod) {
      return NextResponse.json({ 
        error: `Minimum staking period is ${pool.minStakingPeriod} days` 
      }, { status: 400 });
    }

    if (stakingPeriod && pool.maxStakingPeriod && stakingPeriod > pool.maxStakingPeriod) {
      return NextResponse.json({ 
        error: `Maximum staking period is ${pool.maxStakingPeriod} days` 
      }, { status: 400 });
    }

    // Calculate rarity score and staking multiplier
    const rarityScore = calculateRarityScore(nftMetadata);
    const stakingMultiplier = calculateStakingMultiplier(rarityScore, pool.rarityMultipliers, stakingPeriod);

    // Calculate lock end date if staking period is specified
    let lockEndsAt: Date | null = null;
    if (stakingPeriod) {
      lockEndsAt = new Date();
      lockEndsAt.setDate(lockEndsAt.getDate() + stakingPeriod);
    }

    // Create NFT stake
    const stake = await prisma.nFTStake.create({
      data: {
        poolId,
        userId: session.user.id,
        nftId,
        nftMetadata,
        rarityScore,
        stakingMultiplier,
        lockEndsAt,
      },
      include: {
        pool: true
      }
    });

    // Update pool total staked count
    await prisma.nFTStakingPool.update({
      where: { id: poolId },
      data: { totalStaked: { increment: 1 } }
    });

    return NextResponse.json({ 
      stake,
      estimatedDailyReward: pool.baseRewardRate * stakingMultiplier,
      message: `Successfully staked ${nftMetadata.name} with ${stakingMultiplier}x multiplier`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Calculate rarity score based on NFT attributes
function calculateRarityScore(metadata: any): number {
  if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
    return 1.0; // Base rarity
  }

  // Simplified rarity calculation
  // In production, this would use actual collection statistics
  let rarityScore = 1.0;
  
  for (const attr of metadata.attributes) {
    if (attr.trait_type && attr.value) {
      // Assign rarity based on trait type (simplified)
      switch (attr.trait_type.toLowerCase()) {
        case 'legendary':
        case 'mythic':
          rarityScore += 2.0;
          break;
        case 'epic':
        case 'rare':
          rarityScore += 1.5;
          break;
        case 'uncommon':
          rarityScore += 1.0;
          break;
        default:
          rarityScore += 0.5;
      }
    }
  }

  return Math.min(rarityScore, 10.0); // Cap at 10x
}

// Calculate staking multiplier based on rarity and lock period
function calculateStakingMultiplier(rarityScore: number, rarityMultipliers: any, stakingPeriod?: number): number {
  let multiplier = rarityScore;

  // Apply lock period bonus
  if (stakingPeriod) {
    if (stakingPeriod >= 365) multiplier *= 2.0;      // 1 year = 2x
    else if (stakingPeriod >= 180) multiplier *= 1.5; // 6 months = 1.5x
    else if (stakingPeriod >= 90) multiplier *= 1.25; // 3 months = 1.25x
    else if (stakingPeriod >= 30) multiplier *= 1.1;  // 1 month = 1.1x
  }

  return Math.min(multiplier, 20.0); // Cap at 20x
}

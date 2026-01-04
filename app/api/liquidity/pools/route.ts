import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AddLiquiditySchema = z.object({
  poolId: z.string().uuid(),
  tokenAAmount: z.number().min(0),
  tokenBAmount: z.number().min(0),
  lpTokenAmount: z.number().min(0),
});

// Get all liquidity pools
export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const isActive = url.searchParams.get('active') !== 'false';

    const pools = await prisma.liquidityPool.findMany({
      where: { isActive },
      include: {
        _count: {
          select: { positions: true }
        },
        ...(session?.user?.id && {
          positions: {
            where: { userId: session.user.id },
            select: {
              id: true,
              lpTokenAmount: true,
              tokenAAmount: true,
              tokenBAmount: true,
              rewardDebt: true,
              lastClaimTime: true,
              createdAt: true
            }
          }
        })
      },
      orderBy: { totalLiquidity: 'desc' }
    });

    // Calculate APY and rewards for each pool
    const poolsWithMetrics = pools.map(pool => {
      const now = new Date();
      const timeRemaining = Math.max(0, pool.periodFinish.getTime() - now.getTime());
      const daysRemaining = timeRemaining / (1000 * 60 * 60 * 24);
      
      // Calculate estimated APY based on current reward rate and total liquidity
      let estimatedAPY = 0;
      if (pool.totalLiquidity > 0) {
        const dailyRewards = pool.rewardRate * 86400; // 24 hours in seconds
        const yearlyRewards = dailyRewards * 365;
        // Assuming TAP price for APY calculation (simplified)
        estimatedAPY = (yearlyRewards / Number(pool.totalLiquidity)) * 100;
      }

      const userPosition = session?.user?.id ? pool.positions?.[0] : null;
      let userPendingRewards = 0;

      if (userPosition) {
        // Calculate pending rewards (simplified calculation)
        const timeSinceLastClaim = Math.max(0, now.getTime() - userPosition.lastClaimTime.getTime());
        const secondsSinceLastClaim = timeSinceLastClaim / 1000;
        const userShare = Number(userPosition.lpTokenAmount) / Number(pool.totalLiquidity);
        userPendingRewards = Math.floor(pool.rewardRate * secondsSinceLastClaim * userShare);
      }

      return {
        ...pool,
        estimatedAPY,
        daysRemaining,
        totalProviders: pool._count.positions,
        userPosition,
        userPendingRewards,
        isExpired: now > pool.periodFinish
      };
    });

    return NextResponse.json({ pools: poolsWithMetrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add liquidity to a pool
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { poolId, tokenAAmount, tokenBAmount, lpTokenAmount } = AddLiquiditySchema.parse(body);

    // Get pool details
    const pool = await prisma.liquidityPool.findUnique({
      where: { id: poolId, isActive: true }
    });

    if (!pool) {
      return NextResponse.json({ error: "Pool not found or inactive" }, { status: 404 });
    }

    // Check if pool is still active (not expired)
    const now = new Date();
    if (now > pool.periodFinish) {
      return NextResponse.json({ error: "Pool rewards period has ended" }, { status: 400 });
    }

    // Validate user has sufficient TAP balance (tokenA is always TAP)
    const userBalance = await prisma.tapCoinTransaction.aggregate({
      where: { userId: session.user.id },
      _sum: { amount: true }
    });

    const balance = userBalance._sum.amount || 0;
    if (balance < tokenAAmount) {
      return NextResponse.json({ 
        error: "Insufficient TAP balance",
        required: tokenAAmount,
        available: balance
      }, { status: 400 });
    }

    // Add liquidity in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already has a position in this pool
      const existingPosition = await tx.liquidityPosition.findUnique({
        where: { 
          userId_poolId: { 
            userId: session.user.id, 
            poolId 
          } 
        }
      });

      let position;
      if (existingPosition) {
        // Update existing position
        position = await tx.liquidityPosition.update({
          where: { id: existingPosition.id },
          data: {
            lpTokenAmount: { increment: lpTokenAmount },
            tokenAAmount: { increment: tokenAAmount },
            tokenBAmount: { increment: tokenBAmount },
            updatedAt: now
          },
          include: { pool: true }
        });
      } else {
        // Create new position
        position = await tx.liquidityPosition.create({
          data: {
            userId: session.user.id,
            poolId,
            lpTokenAmount,
            tokenAAmount,
            tokenBAmount,
          },
          include: { pool: true }
        });
      }

      // Debit user TAP balance
      await tx.tapCoinTransaction.create({
        data: {
          userId: session.user.id,
          amount: -tokenAAmount,
          reason: `LIQUIDITY_ADD_${pool.name.toUpperCase().replace(/\s+/g, '_')}`
        }
      });

      // Update pool total liquidity
      await tx.liquidityPool.update({
        where: { id: poolId },
        data: { 
          totalLiquidity: { increment: lpTokenAmount },
          lastUpdateTime: now
        }
      });

      return position;
    });

    return NextResponse.json({ position: result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

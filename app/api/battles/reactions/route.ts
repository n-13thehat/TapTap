import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReactionSchema = z.object({
  battleContentId: z.string().uuid(),
  reactionType: z.enum(['FIRE', 'CLAP', 'MIND_BLOWN', 'LAUGHING', 'CRINGE', 'SLEEPY', 'ANGRY', 'LOVE']),
  intensity: z.number().min(1).max(5).default(1),
  timestamp: z.number().optional(), // Video timestamp in seconds
});

const WagerSchema = z.object({
  battleContentId: z.string().uuid(),
  wagerType: z.enum(['REACTION_COUNT', 'BATTLER_WIN', 'REACTION_TYPE', 'VIEW_MILESTONE']),
  amount: z.number().min(10).max(100000), // TAP coins
  battlerChoice: z.string().optional(), // for BATTLER_WIN wagers
  reactionThreshold: z.number().optional(), // for REACTION_COUNT wagers
  reactionTypeChoice: z.enum(['FIRE', 'CLAP', 'MIND_BLOWN', 'LAUGHING', 'CRINGE', 'SLEEPY', 'ANGRY', 'LOVE']).optional(),
});

// Get live reactions and betting data for a battle
export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const battleContentId = url.searchParams.get('battleContentId');
    const timeWindow = parseInt(url.searchParams.get('timeWindow') || '300'); // 5 minutes default

    if (!battleContentId) {
      return NextResponse.json({ error: "Battle content ID required" }, { status: 400 });
    }

    // Get battle content details
    const battleContent = await prisma.battleContent.findUnique({
      where: { id: battleContentId },
      include: {
        league: {
          select: {
            name: true,
            tier: true
          }
        }
      }
    });

    if (!battleContent) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    // Get recent reactions (last timeWindow seconds)
    const recentReactions = await prisma.battleReaction.findMany({
      where: {
        battleContentId,
        timestamp: {
          gte: new Date(Date.now() - timeWindow * 1000)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Aggregate reaction statistics
    const reactionStats = await prisma.battleReaction.groupBy({
      by: ['reactionType'],
      where: { battleContentId },
      _count: { reactionType: true },
      _avg: { intensity: true }
    });

    // Get active wagers
    const activeWagers = await prisma.battleWager.findMany({
      where: {
        battleContentId,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: { amount: 'desc' }
    });

    // Calculate wager pools by type
    const wagerPools = await prisma.battleWager.groupBy({
      by: ['wagerType', 'battlerChoice'],
      where: {
        battleContentId,
        status: 'ACTIVE'
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Get user's reactions and wagers if authenticated
    let userReactions = [];
    let userWagers = [];
    
    if (session?.user?.id) {
      userReactions = await prisma.battleReaction.findMany({
        where: {
          battleContentId,
          userId: session.user.id
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      userWagers = await prisma.battleWager.findMany({
        where: {
          battleContentId,
          userId: session.user.id,
          status: 'ACTIVE'
        }
      });
    }

    // Calculate live metrics
    const totalReactions = reactionStats.reduce((sum, stat) => sum + stat._count.reactionType, 0);
    const dominantReaction = reactionStats.reduce((max, stat) => 
      stat._count.reactionType > (max?._count?.reactionType || 0) ? stat : max, null
    );

    // Calculate battler reaction scores (if battlers are identified)
    let battlerScores = null;
    if (battleContent.battlerA && battleContent.battlerB) {
      // This would require more sophisticated analysis of reaction timing
      // For now, we'll use a simplified approach
      const battlerAReactions = Math.floor(totalReactions * 0.6); // Placeholder
      const battlerBReactions = totalReactions - battlerAReactions;
      
      battlerScores = {
        [battleContent.battlerA]: battlerAReactions,
        [battleContent.battlerB]: battlerBReactions
      };
    }

    return NextResponse.json({
      battleContent,
      liveMetrics: {
        totalReactions,
        recentReactions: recentReactions.length,
        dominantReaction: dominantReaction?.reactionType || null,
        battlerScores,
        activeViewers: Math.floor(Math.random() * 500) + 100, // Placeholder - would be real-time
      },
      reactionStats: reactionStats.map(stat => ({
        type: stat.reactionType,
        count: stat._count.reactionType,
        avgIntensity: stat._avg.intensity
      })),
      recentReactions,
      wagerPools: wagerPools.map(pool => ({
        type: pool.wagerType,
        battlerChoice: pool.battlerChoice,
        totalAmount: pool._sum.amount,
        totalWagers: pool._count.id
      })),
      activeWagers,
      userReactions,
      userWagers
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Submit reaction or place wager
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'react') {
      const { battleContentId, reactionType, intensity, timestamp } = ReactionSchema.parse(body);

      // Rate limiting: max 10 reactions per minute per user per battle
      const recentReactions = await prisma.battleReaction.count({
        where: {
          battleContentId,
          userId: session.user.id,
          timestamp: {
            gte: new Date(Date.now() - 60 * 1000) // Last minute
          }
        }
      });

      if (recentReactions >= 10) {
        return NextResponse.json({ error: "Rate limit exceeded. Max 10 reactions per minute." }, { status: 429 });
      }

      // Create reaction
      const reaction = await prisma.battleReaction.create({
        data: {
          battleContentId,
          userId: session.user.id,
          reactionType,
          intensity,
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        }
      });

      // Update battle analytics
      await updateBattleAnalytics(battleContentId);

      return NextResponse.json({ 
        reaction,
        message: `${reactionType} reaction added!`
      });

    } else if (action === 'wager') {
      const { battleContentId, wagerType, amount, battlerChoice, reactionThreshold, reactionTypeChoice } = WagerSchema.parse(body);

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

      // Validate wager parameters
      if (wagerType === 'BATTLER_WIN' && !battlerChoice) {
        return NextResponse.json({ error: "Battler choice required for BATTLER_WIN wager" }, { status: 400 });
      }

      if (wagerType === 'REACTION_COUNT' && !reactionThreshold) {
        return NextResponse.json({ error: "Reaction threshold required for REACTION_COUNT wager" }, { status: 400 });
      }

      if (wagerType === 'REACTION_TYPE' && !reactionTypeChoice) {
        return NextResponse.json({ error: "Reaction type choice required for REACTION_TYPE wager" }, { status: 400 });
      }

      // Create wager and debit balance
      const result = await prisma.$transaction(async (tx) => {
        // Create wager
        const wager = await tx.battleWager.create({
          data: {
            battleContentId,
            userId: session.user.id,
            wagerType,
            amount,
            battlerChoice,
            reactionThreshold,
            status: 'ACTIVE'
          }
        });

        // Debit user balance
        await tx.tapCoinTransaction.create({
          data: {
            userId: session.user.id,
            amount: -amount,
            reason: `BATTLE_WAGER_${wagerType}`
          }
        });

        return wager;
      });

      return NextResponse.json({ 
        wager: result,
        message: `Wager placed successfully! ${amount} TAP coins wagered on ${wagerType}.`
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update battle analytics with current reaction data
async function updateBattleAnalytics(battleContentId: string) {
  try {
    // Get current reaction breakdown
    const reactionBreakdown = await prisma.battleReaction.groupBy({
      by: ['reactionType'],
      where: { battleContentId },
      _count: { reactionType: true }
    });

    const totalReactions = reactionBreakdown.reduce((sum, r) => sum + r._count.reactionType, 0);

    // Get active wager stats
    const wagerStats = await prisma.battleWager.aggregate({
      where: { 
        battleContentId,
        status: 'ACTIVE'
      },
      _count: { id: true },
      _sum: { amount: true }
    });

    // Calculate engagement score (reactions + wagers weighted)
    const engagementScore = (totalReactions * 1) + ((wagerStats._count.id || 0) * 10);

    // Create analytics record
    await prisma.battleAnalytics.create({
      data: {
        battleContentId,
        totalReactions,
        reactionBreakdown: reactionBreakdown.reduce((acc, r) => {
          acc[r.reactionType] = r._count.reactionType;
          return acc;
        }, {} as Record<string, number>),
        activeViewers: Math.floor(Math.random() * 500) + 100, // Placeholder
        totalWagers: wagerStats._count.id || 0,
        wagerVolume: wagerStats._sum.amount || 0,
        engagementScore
      }
    });
  } catch (error) {
    console.error('Error updating battle analytics:', error);
  }
}

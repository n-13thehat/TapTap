import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

// Get comprehensive battle analytics
export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const battleContentId = url.searchParams.get('battleContentId');
    const leagueId = url.searchParams.get('leagueId');
    const timeframe = url.searchParams.get('timeframe') || '7d'; // 1d, 7d, 30d, 90d, all
    const type = url.searchParams.get('type') || 'overview'; // overview, reactions, betting, performance

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0); // Beginning of time
    
    switch (timeframe) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    if (type === 'overview' || type === 'all') {
      // Platform-wide battle analytics
      const overviewStats = await getBattleOverviewStats(startDate, leagueId);
      
      if (type === 'overview') {
        return NextResponse.json(overviewStats);
      }
    }

    if (battleContentId) {
      // Specific battle analytics
      const battleAnalytics = await getBattleSpecificAnalytics(battleContentId, startDate);
      return NextResponse.json(battleAnalytics);
    }

    // League-specific or platform-wide analytics
    const analytics = await getDetailedAnalytics(startDate, leagueId, type);
    return NextResponse.json(analytics);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get platform-wide battle overview statistics
async function getBattleOverviewStats(startDate: Date, leagueId?: string | null) {
  const whereClause = {
    createdAt: { gte: startDate },
    ...(leagueId && { leagueId })
  };

  // Basic battle metrics
  const totalBattles = await prisma.battleContent.count({
    where: { 
      status: 'ACTIVE',
      publishedAt: { gte: startDate },
      ...(leagueId && { leagueId })
    }
  });

  const totalViews = await prisma.battleContent.aggregate({
    where: { 
      status: 'ACTIVE',
      publishedAt: { gte: startDate },
      ...(leagueId && { leagueId })
    },
    _sum: { viewCount: true }
  });

  // Reaction metrics
  const reactionStats = await prisma.battleReaction.groupBy({
    by: ['reactionType'],
    where: {
      timestamp: { gte: startDate },
      ...(leagueId && { 
        battleContent: { leagueId }
      })
    },
    _count: { reactionType: true }
  });

  const totalReactions = reactionStats.reduce((sum, stat) => sum + stat._count.reactionType, 0);

  // Betting metrics
  const battleWager = (prisma as any).battleWager;
  const hasBattleWager = Boolean(battleWager);
  const bettingStats = hasBattleWager
    ? await battleWager.aggregate({
        where: {
          createdAt: { gte: startDate },
          ...(leagueId && { 
            battleContent: { leagueId }
          })
        },
        _count: { id: true },
        _sum: { amount: true }
      })
    : { _count: { id: 0 }, _sum: { amount: 0 } };

  // League performance
  const leagueStats = await prisma.battleLeague.findMany({
    where: leagueId ? { id: leagueId } : {},
    include: {
      _count: {
        select: { battles: true }
      }
    },
    orderBy: { totalViews: 'desc' },
    take: 10
  });

  // Top performing battles
  const topBattles = await prisma.battleContent.findMany({
    where: {
      status: 'ACTIVE',
      publishedAt: { gte: startDate },
      ...(leagueId && { leagueId })
    },
    include: {
      league: {
        select: { name: true, tier: true }
      },
      analytics: {
        orderBy: { timestamp: 'desc' },
        take: 1,
        select: { totalWagers: true }
      },
      _count: {
        select: {
          reactions: true
        }
      }
    },
    orderBy: [
      { viewCount: 'desc' },
      { publishedAt: 'desc' }
    ],
    take: 10
  });

  // Calculate engagement rates
  const avgEngagement = totalBattles > 0 ? totalReactions / totalBattles : 0;
  const avgBettingVolume = totalBattles > 0 ? (bettingStats._sum.amount || 0) / totalBattles : 0;

  return {
    overview: {
      totalBattles,
      totalViews: totalViews._sum.viewCount || 0,
      totalReactions,
      totalWagers: bettingStats._count.id || 0,
      totalWagerVolume: bettingStats._sum.amount || 0,
      avgEngagement,
      avgBettingVolume
    },
    reactionBreakdown: reactionStats.map(stat => ({
      type: stat.reactionType,
      count: stat._count.reactionType,
      percentage: totalReactions > 0 ? (stat._count.reactionType / totalReactions) * 100 : 0
    })),
    topLeagues: leagueStats.map(league => ({
      id: league.id,
      name: league.name,
      tier: league.tier,
      totalBattles: league._count.battles,
      totalViews: league.totalViews,
      avgViews: league.totalBattles > 0 ? Math.round(league.totalViews / league.totalBattles) : 0
    })),
    topBattles: topBattles.map(battle => ({
      id: battle.id,
      title: battle.title,
      league: battle.league.name,
      viewCount: battle.viewCount,
      reactions: battle._count.reactions,
      wagers: battle.analytics?.[0]?.totalWagers || 0,
      publishedAt: battle.publishedAt
    }))
  };
}

// Get analytics for a specific battle
async function getBattleSpecificAnalytics(battleContentId: string, startDate: Date) {
  // Battle details
  const battle = await prisma.battleContent.findUnique({
    where: { id: battleContentId },
    include: {
      league: {
        select: { name: true, tier: true }
      }
    }
  });

  if (!battle) {
    throw new Error('Battle not found');
  }

  // Reaction timeline (hourly breakdown)
  const reactionTimeline = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('hour', timestamp) as hour,
      reaction_type,
      COUNT(*) as count
    FROM "BattleReaction" 
    WHERE battle_content_id = ${battleContentId}
      AND timestamp >= ${startDate}
    GROUP BY hour, reaction_type
    ORDER BY hour ASC
  `;

  // Betting patterns
  const battleWager = (prisma as any).battleWager;
  const hasBattleWager = Boolean(battleWager);
  const bettingPatterns = hasBattleWager
    ? await battleWager.groupBy({
        by: ['wagerType', 'battlerChoice'],
        where: {
          battleContentId,
          createdAt: { gte: startDate }
        },
        _count: { id: true },
        _sum: { amount: true },
        _avg: { amount: true }
      })
    : [];

  // User engagement metrics
  const uniqueReactors = await prisma.battleReaction.findMany({
    where: {
      battleContentId,
      timestamp: { gte: startDate }
    },
    select: { userId: true },
    distinct: ['userId']
  });

  const uniqueBettors = hasBattleWager
    ? await battleWager.findMany({
        where: {
          battleContentId,
          createdAt: { gte: startDate }
        },
        select: { userId: true },
        distinct: ['userId']
      })
    : [];

  // Performance metrics over time
  const performanceMetrics = await prisma.battleAnalytics.findMany({
    where: {
      battleContentId,
      timestamp: { gte: startDate }
    },
    orderBy: { timestamp: 'asc' }
  });

  return {
    battle: {
      id: battle.id,
      title: battle.title,
      league: battle.league.name,
      battlerA: battle.battlerA,
      battlerB: battle.battlerB,
      viewCount: battle.viewCount,
      publishedAt: battle.publishedAt
    },
    engagement: {
      uniqueReactors: uniqueReactors.length,
      uniqueBettors: uniqueBettors.length,
      totalReactions: await prisma.battleReaction.count({
        where: { battleContentId, timestamp: { gte: startDate } }
      }),
      totalWagers: hasBattleWager
        ? await battleWager.count({
            where: { battleContentId, createdAt: { gte: startDate } }
          })
        : 0
    },
    reactionTimeline,
    bettingPatterns: bettingPatterns.map(pattern => ({
      type: pattern.wagerType,
      battlerChoice: pattern.battlerChoice,
      totalWagers: pattern._count.id,
      totalAmount: pattern._sum.amount,
      avgAmount: pattern._avg.amount
    })),
    performanceMetrics
  };
}

// Get detailed analytics by type
async function getDetailedAnalytics(startDate: Date, leagueId?: string | null, type: string = 'all') {
  const result: any = {};

  if (type === 'reactions' || type === 'all') {
    // Detailed reaction analytics
    result.reactions = await getReactionAnalytics(startDate, leagueId);
  }

  if (type === 'betting' || type === 'all') {
    // Detailed betting analytics
    result.betting = await getBettingAnalytics(startDate, leagueId);
  }

  if (type === 'performance' || type === 'all') {
    // Performance analytics
    result.performance = await getPerformanceAnalytics(startDate, leagueId);
  }

  return result;
}

// Detailed reaction analytics
async function getReactionAnalytics(startDate: Date, leagueId?: string | null) {
  // Implementation would include reaction patterns, user behavior, etc.
  return {
    totalReactions: 0,
    reactionTypes: [],
    userEngagement: {},
    trends: []
  };
}

// Detailed betting analytics
async function getBettingAnalytics(startDate: Date, leagueId?: string | null) {
  // Implementation would include betting patterns, win rates, etc.
  return {
    totalWagers: 0,
    totalVolume: 0,
    winRates: {},
    popularBets: []
  };
}

// Performance analytics
async function getPerformanceAnalytics(startDate: Date, leagueId?: string | null) {
  // Implementation would include battle performance metrics
  return {
    topPerformers: [],
    engagementTrends: [],
    viewerRetention: {}
  };
}

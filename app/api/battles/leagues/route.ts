import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Top 10 Battle Leagues Configuration
const BATTLE_LEAGUES = [
  {
    name: "Ultimate Rap League (URL)",
    youtubeChannelId: "UCYkq8J0QmS9B3rR9f7D7xVg",
    tier: "MAJOR",
    description: "The premier battle rap league featuring the biggest names in battle rap"
  },
  {
    name: "King of the Dot (KOTD)",
    youtubeChannelId: "UCQ7Dq9PSQw-DAKjN9Vy5ElQ", 
    tier: "MAJOR",
    description: "Canada's premier battle rap league with international reach"
  },
  {
    name: "BullPen Battle League",
    youtubeChannelId: "UCk0S7m8uhZ8vPZbPKQ0n2GQ",
    tier: "MAJOR", 
    description: "High-energy battle rap league known for intense matchups"
  },
  {
    name: "Rare Breed Entertainment",
    youtubeChannelId: "UCpQeZLAqM6TZcX5q6T1gQLg",
    tier: "REGIONAL",
    description: "Rising battle rap league with fresh talent"
  },
  {
    name: "Don't Flop",
    youtubeChannelId: "UC6P8G98npC7Vvfy4D9Kx1lQ",
    tier: "MAJOR",
    description: "UK's premier battle rap league"
  },
  {
    name: "iBattle Worldwide",
    youtubeChannelId: "UCjOdmBHQIb8MpWXkNgIFvjA",
    tier: "REGIONAL",
    description: "International battle rap platform"
  },
  {
    name: "SMACK/URL",
    youtubeChannelId: "UCYkq8J0QmS9B3rR9f7D7xVg", // Same as URL
    tier: "MAJOR",
    description: "The original battle rap league that started it all"
  },
  {
    name: "Grind Time Now",
    youtubeChannelId: "UCfJPoMdKPDQF8_-5gUfGEOw",
    tier: "REGIONAL",
    description: "West Coast battle rap league"
  },
  {
    name: "FlipTop Battle League",
    youtubeChannelId: "UCBGOjhWGwJKzJhvrjcnw8dA",
    tier: "REGIONAL",
    description: "Philippines' premier battle rap league"
  },
  {
    name: "Versus Battle League",
    youtubeChannelId: "UCvdMROIz8bMzNzJuVCE8Qeg",
    tier: "EMERGING",
    description: "Up-and-coming battle rap league"
  }
];

const API_KEY = process.env.YOUTUBE_API_KEY;

// Get all battle leagues and their stats
export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const sync = url.searchParams.get('sync') === 'true';

    // Get leagues from database
    let leagues = await prisma.battleLeague.findMany({
      include: {
        _count: {
          select: { battles: true }
        },
        battles: {
          where: { status: 'ACTIVE' },
          orderBy: { publishedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            viewCount: true,
            publishedAt: true
          }
        }
      },
      orderBy: [
        { tier: 'asc' },
        { totalViews: 'desc' }
      ]
    });

    // Initialize leagues if empty or sync requested
    if (leagues.length === 0 || sync) {
      await initializeBattleLeagues();
      
      leagues = await prisma.battleLeague.findMany({
        include: {
          _count: {
            select: { battles: true }
          },
          battles: {
            where: { status: 'ACTIVE' },
            orderBy: { publishedAt: 'desc' },
            take: 5,
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              viewCount: true,
              publishedAt: true
            }
          }
        },
        orderBy: [
          { tier: 'asc' },
          { totalViews: 'desc' }
        ]
      });
    }

    // Calculate league metrics
    const leaguesWithMetrics = leagues.map(league => ({
      ...league,
      metrics: {
        totalBattles: league._count.battles,
        avgViewsPerBattle: league.totalBattles > 0 ? Math.round(league.totalViews / league.totalBattles) : 0,
        recentActivity: league.battles.length,
        lastUpdate: league.lastSyncAt
      }
    }));

    return NextResponse.json({ 
      leagues: leaguesWithMetrics,
      summary: {
        totalLeagues: leagues.length,
        majorLeagues: leagues.filter(l => l.tier === 'MAJOR').length,
        totalBattles: leagues.reduce((sum, l) => sum + l._count.battles, 0),
        totalViews: leagues.reduce((sum, l) => sum + l.totalViews, 0)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Sync league data from YouTube
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { leagueId, fullSync = false } = body;

    let syncResults = [];

    if (leagueId) {
      // Sync specific league
      const result = await syncLeagueContent(leagueId, fullSync);
      syncResults.push(result);
    } else {
      // Sync all leagues
      const leagues = await prisma.battleLeague.findMany({
        where: { isActive: true }
      });

      for (const league of leagues) {
        try {
          const result = await syncLeagueContent(league.id, fullSync);
          syncResults.push(result);
        } catch (error) {
          syncResults.push({
            leagueId: league.id,
            success: false,
            error: error.message
          });
        }
      }
    }

    return NextResponse.json({ 
      syncResults,
      message: `Synced ${syncResults.filter(r => r.success).length} leagues successfully`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Initialize battle leagues in database
async function initializeBattleLeagues() {
  for (const leagueData of BATTLE_LEAGUES) {
    await prisma.battleLeague.upsert({
      where: { youtubeChannelId: leagueData.youtubeChannelId },
      update: {
        name: leagueData.name,
        description: leagueData.description,
        tier: leagueData.tier as any
      },
      create: {
        name: leagueData.name,
        youtubeChannelId: leagueData.youtubeChannelId,
        channelName: leagueData.name,
        description: leagueData.description,
        tier: leagueData.tier as any
      }
    });
  }
}

// Sync content for a specific league
async function syncLeagueContent(leagueId: string, fullSync: boolean = false) {
  // Implementation for syncing YouTube content will be added in next file
  return {
    leagueId,
    success: true,
    battlesAdded: 0,
    battlesUpdated: 0
  };
}

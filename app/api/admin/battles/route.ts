import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";

const UI_STATUS_TO_CONTENT_STATUS: Record<string, string> = {
  LIVE: "ACTIVE",
  SCHEDULED: "PENDING_REVIEW",
  COMPLETED: "ARCHIVED",
  CANCELLED: "REMOVED",
};

function mapBattleContentStatus(status: string) {
  switch (status) {
    case "ACTIVE":
      return "LIVE";
    case "PENDING_REVIEW":
      return "SCHEDULED";
    case "ARCHIVED":
      return "COMPLETED";
    case "REMOVED":
      return "CANCELLED";
    default:
      return status;
  }
}

async function requireAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return null;
  const user = await prisma.user.findUnique({ 
    where: { email }, 
    select: { id: true, role: true } 
  });
  if (!user || (user.role as any) !== "ADMIN") return null;
  return user;
}

export async function GET(req: Request) {
  const rl = await rateGate(req, "admin:battles", { capacity: 20, refillPerSec: 0.2 });
  if (rl) return rl;
  
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const normalizedStatus = status?.toUpperCase();
    const battleWhere: any = {};
    const contentWhere: any = {};

    if (normalizedStatus) {
      if (["ACTIVE", "ARCHIVED", "REMOVED", "PENDING_REVIEW"].includes(normalizedStatus)) {
        contentWhere.status = normalizedStatus;
      } else if (UI_STATUS_TO_CONTENT_STATUS[normalizedStatus]) {
        contentWhere.status = UI_STATUS_TO_CONTENT_STATUS[normalizedStatus];
      } else {
        battleWhere.status = normalizedStatus;
      }
    }

    // Check if Battle/BattleContent models exist
    const hasBattle = Boolean((prisma as any).battle);
    const hasBattleContent = Boolean((prisma as any).battleContent);
    const hasBattleWager = Boolean((prisma as any).battleWager);
    const hasBattleLeague = Boolean((prisma as any).battleLeague);

    let battles: any[] = [];
    let total = 0;

    if (hasBattle) {
      battles = await (prisma as any).battle.findMany({
        where: battleWhere,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          league: hasBattleLeague ? {
            select: {
              name: true,
              tier: true
            }
          } : false,
          wagers: hasBattleWager ? {
            select: {
              amount: true
            }
          } : false
        }
      });

      // Transform the data to match our interface
      battles = battles.map((battle: any) => ({
        id: battle.id,
        title: battle.title || `${battle.battlerA} vs ${battle.battlerB}`,
        battlerA: battle.battlerA,
        battlerB: battle.battlerB,
        status: battle.status,
        scheduledAt: battle.scheduledAt || battle.createdAt,
        viewCount: battle.viewCount || 0,
        wagerAmount: battle.wagers?.reduce((sum: number, w: any) => sum + (w.amount || 0), 0) || 0,
        league: battle.league
      }));
      total = await (prisma as any).battle.count({ where: battleWhere });
    } else if (hasBattleContent) {
      const content = await (prisma as any).battleContent.findMany({
        where: contentWhere,
        take: limit,
        skip: offset,
        orderBy: { publishedAt: 'desc' },
        include: {
          league: hasBattleLeague ? {
            select: {
              name: true,
              tier: true,
            }
          } : false,
          analytics: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: {
              totalWagers: true,
              wagerVolume: true,
            }
          }
        }
      });

      battles = content.map((battle: any) => {
        const latestAnalytics = battle.analytics?.[0];
        return {
          id: battle.id,
          title: battle.title,
          battlerA: battle.battlerA || 'Unknown A',
          battlerB: battle.battlerB || 'Unknown B',
          status: mapBattleContentStatus(battle.status),
          scheduledAt: battle.featuredAt || battle.publishedAt,
          viewCount: battle.viewCount || 0,
          wagerAmount: latestAnalytics?.wagerVolume || 0,
          league: battle.league || undefined
        };
      });

      total = await (prisma as any).battleContent.count({ where: contentWhere });
    }

    return NextResponse.json({
      battles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error: any) {
    console.error('Admin battles fetch error:', error);
    return NextResponse.json({ 
      error: "Failed to fetch battles",
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const rl = await rateGate(req, "admin:battles:create", { capacity: 5, refillPerSec: 0.05 });
  if (rl) return rl;
  
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, battlerA, battlerB, scheduledAt, leagueId, battleType } = body;

    // Validate required fields
    if (!battlerA || !battlerB) {
      return NextResponse.json({ error: "Battler names are required" }, { status: 400 });
    }

    const hasBattle = Boolean((prisma as any).battle);
    if (!hasBattle) {
      return NextResponse.json({ error: "Battle system not available" }, { status: 503 });
    }

    const battle = await (prisma as any).battle.create({
      data: {
        title: title || `${battlerA} vs ${battlerB}`,
        battlerA,
        battlerB,
        battleType: battleType || 'HEAD_TO_HEAD',
        status: 'SCHEDULED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        leagueId: leagueId || null,
        viewCount: 0
      }
    });

    return NextResponse.json({ 
      success: true, 
      battle: {
        id: battle.id,
        title: battle.title,
        battlerA: battle.battlerA,
        battlerB: battle.battlerB,
        status: battle.status,
        scheduledAt: battle.scheduledAt,
        viewCount: battle.viewCount,
        wagerAmount: 0
      }
    });
  } catch (error: any) {
    console.error('Admin battle creation error:', error);
    return NextResponse.json({ 
      error: "Failed to create battle",
      details: error.message 
    }, { status: 500 });
  }
}

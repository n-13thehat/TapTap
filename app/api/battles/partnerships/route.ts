import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PartnershipSchema = z.object({
  leagueId: z.string().uuid(),
  partnershipType: z.enum(['CONTENT_LICENSING', 'EXCLUSIVE_PREMIERE', 'REVENUE_SHARE', 'PROMOTIONAL']),
  revenueShare: z.number().min(0).max(1).default(0.5),
  exclusivity: z.boolean().default(false),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)).optional(),
});

const PremiereSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  battlerA: z.string().min(1).max(100),
  battlerB: z.string().min(1).max(100),
  battleType: z.enum(['HEAD_TO_HEAD', 'TOURNAMENT', 'CYPHER', 'FREESTYLE', 'WRITTEN', 'ACAPELLA']),
  scheduledAt: z.string().transform(str => new Date(str)),
  leagueId: z.string().uuid(),
  prizePool: z.number().min(0).default(0),
  isExclusive: z.boolean().default(true),
});

// Get league partnerships and premiere battles
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const url = new URL(req.url);
    const leagueId = url.searchParams.get('leagueId');
    const type = url.searchParams.get('type'); // 'partnerships' | 'premieres' | 'all'

    let partnerships = [];
    let premieres = [];
    let leagues = [];

    if (!type || type === 'partnerships' || type === 'all') {
      partnerships = await prisma.leaguePartnership.findMany({
        where: leagueId ? { leagueId } : {},
        include: {
          league: {
            select: {
              id: true,
              name: true,
              tier: true,
              logoUrl: true,
              totalBattles: true,
              totalViews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!type || type === 'premieres' || type === 'all') {
      // Get upcoming premiere battles (would be in a separate table)
      // For now, we'll show featured battles as premieres
      premieres = await prisma.battleContent.findMany({
        where: {
          isFeatured: true,
          ...(leagueId && { leagueId })
        },
        include: {
          league: {
            select: {
              id: true,
              name: true,
              tier: true,
              logoUrl: true
            }
          },
          _count: {
            select: {
              reactions: true,
              wagers: true
            }
          }
        },
        orderBy: { featuredAt: 'desc' },
        take: 20
      });
    }

    if (!type || type === 'leagues' || type === 'all') {
      leagues = await prisma.battleLeague.findMany({
        include: {
          partnerships: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              partnershipType: true,
              revenueShare: true,
              exclusivity: true
            }
          },
          _count: {
            select: { battles: true }
          }
        },
        orderBy: [
          { tier: 'asc' },
          { totalViews: 'desc' }
        ]
      });
    }

    // Calculate partnership metrics
    const partnershipMetrics = {
      totalPartnerships: partnerships.length,
      activePartnerships: partnerships.filter(p => p.status === 'ACTIVE').length,
      totalRevenue: partnerships.reduce((sum, p) => sum + p.totalRevenue, 0),
      exclusiveDeals: partnerships.filter(p => p.exclusivity).length,
      avgRevenueShare: partnerships.length > 0 ? 
        partnerships.reduce((sum, p) => sum + p.revenueShare, 0) / partnerships.length : 0
    };

    return NextResponse.json({
      partnerships,
      premieres,
      leagues,
      metrics: partnershipMetrics
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create new partnership or premiere battle
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'create_partnership') {
      const partnershipData = PartnershipSchema.parse(body);

      // Check if league exists
      const league = await prisma.battleLeague.findUnique({
        where: { id: partnershipData.leagueId }
      });

      if (!league) {
        return NextResponse.json({ error: "League not found" }, { status: 404 });
      }

      // Check for existing active partnership
      const existingPartnership = await prisma.leaguePartnership.findFirst({
        where: {
          leagueId: partnershipData.leagueId,
          status: 'ACTIVE',
          partnershipType: partnershipData.partnershipType
        }
      });

      if (existingPartnership) {
        return NextResponse.json({ 
          error: "Active partnership of this type already exists with this league" 
        }, { status: 400 });
      }

      // Create partnership
      const partnership = await prisma.leaguePartnership.create({
        data: {
          ...partnershipData,
          status: 'PENDING'
        },
        include: {
          league: {
            select: {
              name: true,
              tier: true
            }
          }
        }
      });

      return NextResponse.json({
        partnership,
        message: `Partnership created with ${league.name}. Status: Pending approval.`
      });

    } else if (action === 'create_premiere') {
      const premiereData = PremiereSchema.parse(body);

      // Check if league exists and has active partnership
      const league = await prisma.battleLeague.findUnique({
        where: { id: premiereData.leagueId },
        include: {
          partnerships: {
            where: {
              status: 'ACTIVE',
              partnershipType: { in: ['EXCLUSIVE_PREMIERE', 'REVENUE_SHARE'] }
            }
          }
        }
      });

      if (!league) {
        return NextResponse.json({ error: "League not found" }, { status: 404 });
      }

      if (premiereData.isExclusive && league.partnerships.length === 0) {
        return NextResponse.json({ 
          error: "Exclusive premiere requires active partnership with league" 
        }, { status: 400 });
      }

      // Create premiere battle content
      const premiere = await prisma.battleContent.create({
        data: {
          leagueId: premiereData.leagueId,
          youtubeVideoId: `premiere_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          title: premiereData.title,
          description: premiereData.description,
          battlerA: premiereData.battlerA,
          battlerB: premiereData.battlerB,
          battleType: premiereData.battleType,
          publishedAt: premiereData.scheduledAt,
          status: 'PENDING_REVIEW',
          isFeatured: true,
          featuredAt: new Date()
        },
        include: {
          league: {
            select: {
              name: true,
              tier: true
            }
          }
        }
      });

      // If there's a prize pool, create initial wager pool
      if (premiereData.prizePool > 0) {
        await prisma.battleWager.create({
          data: {
            battleContentId: premiere.id,
            userId: session.user.id, // Platform as initial wager
            wagerType: 'BATTLER_WIN',
            amount: premiereData.prizePool,
            status: 'ACTIVE'
          }
        });
      }

      return NextResponse.json({
        premiere,
        message: `Premiere battle "${premiereData.title}" scheduled for ${premiereData.scheduledAt.toLocaleDateString()}`
      });

    } else if (action === 'update_partnership') {
      const { partnershipId, status, revenueShare } = body;

      if (!partnershipId) {
        return NextResponse.json({ error: "Partnership ID required" }, { status: 400 });
      }

      const partnership = await prisma.leaguePartnership.update({
        where: { id: partnershipId },
        data: {
          ...(status && { status }),
          ...(revenueShare !== undefined && { revenueShare })
        },
        include: {
          league: {
            select: {
              name: true,
              tier: true
            }
          }
        }
      });

      return NextResponse.json({
        partnership,
        message: `Partnership with ${partnership.league.name} updated successfully`
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

// Update partnership status or revenue
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { partnershipId, revenue } = body;

    if (!partnershipId || revenue === undefined) {
      return NextResponse.json({ error: "Partnership ID and revenue amount required" }, { status: 400 });
    }

    // Update partnership revenue
    const partnership = await prisma.leaguePartnership.update({
      where: { id: partnershipId },
      data: {
        totalRevenue: { increment: revenue }
      },
      include: {
        league: {
          select: {
            name: true
          }
        }
      }
    });

    // Calculate league's share
    const leagueShare = revenue * partnership.revenueShare;
    const platformShare = revenue - leagueShare;

    return NextResponse.json({
      partnership,
      revenue: {
        total: revenue,
        leagueShare,
        platformShare,
        revenueSharePercentage: partnership.revenueShare * 100
      },
      message: `Revenue updated: ${partnership.league.name} receives ${leagueShare} TAP (${partnership.revenueShare * 100}%)`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

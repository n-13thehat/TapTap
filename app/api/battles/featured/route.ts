import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const NominateBattleSchema = z.object({
  battleContentId: z.string().uuid(),
});

const VoteSchema = z.object({
  nominationId: z.string().uuid(),
});

// Get current weekly featured battle status
export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const week = url.searchParams.get('week'); // YYYY-MM-DD format

    // Calculate current week dates
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    // Use specified week or current week
    let weekStart = currentWeekStart;
    let weekEnd = currentWeekEnd;
    
    if (week) {
      weekStart = new Date(week);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
    }

    // Get or create weekly featured battle
    let weeklyFeatured = await prisma.weeklyFeaturedBattle.findUnique({
      where: { weekStartDate: weekStart },
      include: {
        nominations: {
          include: {
            nominator: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          },
          orderBy: { votes: 'desc' }
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    if (!weeklyFeatured) {
      // Create new weekly featured battle
      const votingStartsAt = new Date(weekStart);
      votingStartsAt.setDate(weekStart.getDate() + 1); // Monday
      
      const votingEndsAt = new Date(weekStart);
      votingEndsAt.setDate(weekStart.getDate() + 4); // Thursday
      votingEndsAt.setHours(23, 59, 59, 999);

      weeklyFeatured = await prisma.weeklyFeaturedBattle.create({
        data: {
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          votingStartsAt,
          votingEndsAt,
          status: now < votingStartsAt ? 'NOMINATION' : 
                  now < votingEndsAt ? 'VOTING' : 'COMPLETED'
        },
        include: {
          nominations: {
            include: {
              nominator: {
                select: {
                  id: true,
                  username: true,
                  displayName: true
                }
              }
            },
            orderBy: { votes: 'desc' }
          },
          votes: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true
                }
              }
            }
          }
        }
      });
    }

    // Get battle content details for nominations
    const nominationsWithBattles = await Promise.all(
      weeklyFeatured.nominations.map(async (nomination) => {
        const battleContent = await prisma.battleContent.findUnique({
          where: { id: nomination.battleContentId },
          include: {
            league: {
              select: {
                name: true,
                logoUrl: true,
                tier: true
              }
            }
          }
        });

        return {
          ...nomination,
          battleContent
        };
      })
    );

    // Check if user has voted this week
    const userVote = session?.user?.id ? 
      weeklyFeatured.votes.find(vote => vote.user.id === session.user.id) : null;

    // Get top battles for nomination suggestions
    const suggestedBattles = await prisma.battleContent.findMany({
      where: {
        status: 'ACTIVE',
        publishedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        },
        NOT: {
          id: {
            in: weeklyFeatured.nominations.map(n => n.battleContentId)
          }
        }
      },
      include: {
        league: {
          select: {
            name: true,
            logoUrl: true,
            tier: true
          }
        }
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: 10
    });

    // Calculate time remaining for current phase
    const now_ts = now.getTime();
    const votingStart_ts = weeklyFeatured.votingStartsAt.getTime();
    const votingEnd_ts = weeklyFeatured.votingEndsAt.getTime();
    
    let timeRemaining = 0;
    let currentPhase = 'COMPLETED';
    
    if (now_ts < votingStart_ts) {
      currentPhase = 'NOMINATION';
      timeRemaining = votingStart_ts - now_ts;
    } else if (now_ts < votingEnd_ts) {
      currentPhase = 'VOTING';
      timeRemaining = votingEnd_ts - now_ts;
    }

    return NextResponse.json({
      weeklyFeatured: {
        ...weeklyFeatured,
        nominations: nominationsWithBattles
      },
      suggestedBattles,
      userVote,
      currentPhase,
      timeRemaining,
      canNominate: currentPhase === 'NOMINATION' && session?.user?.id,
      canVote: currentPhase === 'VOTING' && session?.user?.id && !userVote,
      weekInfo: {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        isCurrentWeek: weekStart.getTime() === currentWeekStart.getTime()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Nominate a battle for weekly featured
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'nominate') {
      const { battleContentId } = NominateBattleSchema.parse(body);

      // Get current week
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weeklyFeatured = await prisma.weeklyFeaturedBattle.findUnique({
        where: { weekStartDate: weekStart }
      });

      if (!weeklyFeatured || weeklyFeatured.status !== 'NOMINATION') {
        return NextResponse.json({ error: "Nomination period is not active" }, { status: 400 });
      }

      // Check if battle exists and is eligible
      const battleContent = await prisma.battleContent.findUnique({
        where: { id: battleContentId, status: 'ACTIVE' }
      });

      if (!battleContent) {
        return NextResponse.json({ error: "Battle not found or not eligible" }, { status: 404 });
      }

      // Check if already nominated
      const existingNomination = await prisma.featuredBattleNomination.findUnique({
        where: {
          weeklyFeaturedId_battleContentId: {
            weeklyFeaturedId: weeklyFeatured.id,
            battleContentId
          }
        }
      });

      if (existingNomination) {
        return NextResponse.json({ error: "Battle already nominated this week" }, { status: 400 });
      }

      // Create nomination
      const nomination = await prisma.featuredBattleNomination.create({
        data: {
          weeklyFeaturedId: weeklyFeatured.id,
          battleContentId,
          nominatedBy: session.user.id,
          votes: 1 // Nominator gets first vote
        }
      });

      return NextResponse.json({ 
        nomination,
        message: "Battle nominated successfully! You've cast the first vote."
      });

    } else if (action === 'vote') {
      const { nominationId } = VoteSchema.parse(body);

      // Get current week
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weeklyFeatured = await prisma.weeklyFeaturedBattle.findUnique({
        where: { weekStartDate: weekStart }
      });

      if (!weeklyFeatured || weeklyFeatured.status !== 'VOTING') {
        return NextResponse.json({ error: "Voting period is not active" }, { status: 400 });
      }

      // Check if user already voted
      const existingVote = await prisma.featuredBattleVote.findUnique({
        where: {
          weeklyFeaturedId_userId: {
            weeklyFeaturedId: weeklyFeatured.id,
            userId: session.user.id
          }
        }
      });

      if (existingVote) {
        return NextResponse.json({ error: "You have already voted this week" }, { status: 400 });
      }

      // Verify nomination exists
      const nomination = await prisma.featuredBattleNomination.findUnique({
        where: { id: nominationId }
      });

      if (!nomination || nomination.weeklyFeaturedId !== weeklyFeatured.id) {
        return NextResponse.json({ error: "Invalid nomination" }, { status: 404 });
      }

      // Create vote and update nomination count
      await prisma.$transaction([
        prisma.featuredBattleVote.create({
          data: {
            weeklyFeaturedId: weeklyFeatured.id,
            nominationId,
            userId: session.user.id,
            votingPower: 1
          }
        }),
        prisma.featuredBattleNomination.update({
          where: { id: nominationId },
          data: { votes: { increment: 1 } }
        }),
        prisma.weeklyFeaturedBattle.update({
          where: { id: weeklyFeatured.id },
          data: { totalVotes: { increment: 1 } }
        })
      ]);

      return NextResponse.json({ 
        message: "Vote cast successfully!"
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

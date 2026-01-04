import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";

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
  const rl = await rateGate(req, "admin:dashboard-stats", { capacity: 10, refillPerSec: 0.1 });
  if (rl) return rl;
  
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // User Statistics
    const [totalUsers, creators, admins, activeToday] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CREATOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ 
        where: { 
          updatedAt: { gte: today } 
        } 
      })
    ]);

    // Battle Statistics
    const [totalBattles, liveBattles, featuredBattles] = await Promise.all([
      prisma.battle?.count() || 0,
      prisma.battle?.count({ where: { status: 'LIVE' } }) || 0,
      prisma.weeklyFeaturedBattle?.count({ 
        where: { 
          startDate: { lte: now },
          endDate: { gte: now }
        }
      }) || 0
    ]);

    // Battle Wagers
    const totalWagers = await prisma.battleWager?.aggregate({
      _sum: { amount: true }
    }) || { _sum: { amount: 0 } };

    // Treasury Statistics
    const treasuryUserId = process.env.TREASURY_USER_ID;
    const [treasuryBalance, taxEvents, tipsVolume] = await Promise.all([
      treasuryUserId ? prisma.tapCoinTransaction.aggregate({
        where: { userId: treasuryUserId, reason: "TAPTAX_TREASURY" },
        _sum: { amount: true }
      }) : { _sum: { amount: 0 } },
      prisma.taxEvent?.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo } },
        _sum: { tax: true, burn: true }
      }) || { _sum: { tax: 0, burn: 0 } },
      prisma.tapCoinTransaction.aggregate({
        where: { 
          reason: "TIP",
          createdAt: { gte: thirtyDaysAgo }
        },
        _sum: { amount: true }
      })
    ]);

    // Content Statistics
    const [tracks, albums, playlists, waveformsPending] = await Promise.all([
      prisma.track.count(),
      prisma.album.count(),
      prisma.playlist.count(),
      prisma.track.count({ where: { waveformId: null } })
    ]);

    // AI Agent Statistics
    const [activeAgents, missions, interactions] = await Promise.all([
      prisma.agent?.count({ where: { status: 'ACTIVE' } }) || 0,
      prisma.aiMission?.count() || 0,
      prisma.aiInteractionLog?.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }) || 0
    ]);

    // Governance Statistics
    const [activeProposals, totalVotes] = await Promise.all([
      prisma.proposal?.count({ 
        where: { 
          status: 'ACTIVE',
          votingEndsAt: { gte: now }
        }
      }) || 0,
      prisma.vote?.count() || 0
    ]);

    const stats = {
      users: {
        total: totalUsers,
        creators,
        admins,
        activeToday
      },
      battles: {
        total: totalBattles,
        live: liveBattles,
        featured: featuredBattles,
        totalWagers: totalWagers._sum.amount || 0
      },
      treasury: {
        balance: treasuryBalance._sum.amount || 0,
        burned: taxEvents._sum.burn || 0,
        taxCollected: taxEvents._sum.tax || 0,
        tipsVolume: tipsVolume._sum.amount || 0
      },
      content: {
        tracks,
        albums,
        playlists,
        waveformsPending
      },
      agents: {
        active: activeAgents,
        missions,
        interactions
      },
      governance: {
        activeProposals,
        totalVotes
      }
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Admin dashboard stats error:', error);
    return NextResponse.json({ 
      error: "Failed to fetch dashboard stats",
      details: error.message 
    }, { status: 500 });
  }
}

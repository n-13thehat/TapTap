import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateAirdropSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  totalAmount: z.number().min(1),
  campaignType: z.enum(['SNAPSHOT_BASED', 'ACTIVITY_BASED', 'REFERRAL_BASED', 'CREATOR_REWARDS', 'COMMUNITY_REWARDS', 'RETROACTIVE', 'MERKLE_TREE']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  eligibilityCriteria: z.record(z.any()),
  antiSybilEnabled: z.boolean().default(true),
  maxClaimPerUser: z.number().min(1).optional(),
});

// Get airdrop campaigns
export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const campaignType = url.searchParams.get('type');

    const where: any = {};
    if (status) where.status = status;
    if (campaignType) where.campaignType = campaignType;

    const campaigns = await prisma.airdropCampaign.findMany({
      where,
      include: {
        _count: {
          select: {
            claims: true,
            eligibility: { where: { isEligible: true } }
          }
        },
        ...(session?.user?.id && {
          eligibility: {
            where: { userId: session.user.id },
            include: {
              claim: true
            }
          }
        })
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate campaign metrics
    const campaignsWithMetrics = campaigns.map(campaign => {
      const now = new Date();
      const isActive = campaign.status === 'ACTIVE' && now >= campaign.startDate && now <= campaign.endDate;
      const isUpcoming = campaign.status === 'ACTIVE' && now < campaign.startDate;
      const isExpired = now > campaign.endDate;
      
      const claimRate = campaign._count.eligibility > 0 
        ? (campaign._count.claims / campaign._count.eligibility) * 100 
        : 0;

      const userEligibility = session?.user?.id ? campaign.eligibility?.[0] : null;
      const userClaim = userEligibility?.claim;

      return {
        ...campaign,
        isActive,
        isUpcoming,
        isExpired,
        claimRate,
        totalEligible: campaign._count.eligibility,
        totalClaimed: campaign._count.claims,
        remainingAmount: campaign.totalAmount - campaign.claimedAmount,
        userEligibility,
        userClaim,
        canClaim: userEligibility?.isEligible && !userClaim && isActive
      };
    });

    return NextResponse.json({ campaigns: campaignsWithMetrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create airdrop campaign (Admin only)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const data = CreateAirdropSchema.parse(body);

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    // Create campaign
    const campaign = await prisma.airdropCampaign.create({
      data: {
        name: data.name,
        description: data.description,
        totalAmount: data.totalAmount,
        campaignType: data.campaignType as any,
        startDate,
        endDate,
        eligibilityCriteria: data.eligibilityCriteria,
        antiSybilEnabled: data.antiSybilEnabled,
        maxClaimPerUser: data.maxClaimPerUser,
      }
    });

    // Auto-generate eligibility based on campaign type
    await generateEligibility(campaign.id, data.campaignType, data.eligibilityCriteria);

    return NextResponse.json({ campaign });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Generate eligibility based on campaign type and criteria
async function generateEligibility(campaignId: string, campaignType: string, criteria: any) {
  try {
    let eligibleUsers: { userId: string; amount: number; score: number }[] = [];

    switch (campaignType) {
      case 'ACTIVITY_BASED':
        // Find users based on activity criteria
        const activityUsers = await prisma.user.findMany({
          where: {
            createdAt: {
              gte: criteria.minAccountAge ? new Date(Date.now() - criteria.minAccountAge * 24 * 60 * 60 * 1000) : undefined
            }
          },
          include: {
            _count: {
              select: {
                tracks: true,
                posts: true,
                tapCoinTxns: true
              }
            }
          }
        });

        eligibleUsers = activityUsers
          .filter(user => {
            const trackCount = user._count.tracks;
            const postCount = user._count.posts;
            const transactionCount = user._count.tapCoinTxns;
            
            return (
              (!criteria.minSongs || trackCount >= criteria.minSongs) &&
              (!criteria.minPosts || postCount >= criteria.minPosts) &&
              (!criteria.minTransactions || transactionCount >= criteria.minTransactions)
            );
          })
          .map(user => ({
            userId: user.id,
            amount: criteria.baseAmount || 1000,
            score: user._count.tracks * 10 + user._count.posts * 5 + user._count.tapCoinTxns
          }));
        break;

      case 'CREATOR_REWARDS':
        // Find creators based on performance
        const creators = await prisma.user.findMany({
          where: {
            role: 'CREATOR'
          },
          include: {
            _count: {
              select: {
                tracks: true,
                followsIncoming: true
              }
            }
          }
        });

        eligibleUsers = creators
          .filter(creator => creator._count.tracks >= (criteria.minSongs || 1))
          .map(creator => ({
            userId: creator.id,
            amount: Math.min(
              criteria.maxAmount || 10000,
              (criteria.baseAmount || 1000) + (creator._count.tracks * 100) + (creator._count.followsIncoming * 10)
            ),
            score: creator._count.tracks + creator._count.followsIncoming
          }));
        break;

      case 'SNAPSHOT_BASED':
        // Find users with TAP balance above threshold
        const balanceUsers = await prisma.tapCoinTransaction.groupBy({
          by: ['userId'],
          _sum: { amount: true },
          having: {
            amount: {
              _sum: { gte: criteria.minBalance || 1000 }
            }
          }
        });

        eligibleUsers = balanceUsers.map(user => ({
          userId: user.userId,
          amount: Math.min(
            criteria.maxAmount || 5000,
            Math.floor((user._sum.amount || 0) * (criteria.multiplier || 0.1))
          ),
          score: user._sum.amount || 0
        }));
        break;
    }

    // Apply anti-sybil filtering if enabled
    if (criteria.antiSybilEnabled) {
      eligibleUsers = eligibleUsers.filter(user => user.score >= (criteria.minScore || 10));
    }

    // Create eligibility records
    if (eligibleUsers.length > 0) {
      await prisma.airdropEligibility.createMany({
        data: eligibleUsers.map(user => ({
          campaignId,
          userId: user.userId,
          amount: user.amount,
          eligibilityScore: user.score,
          merkleProof: [], // Will be populated for merkle tree campaigns
        })),
        skipDuplicates: true
      });
    }

    return eligibleUsers.length;
  } catch (error) {
    console.error('Error generating eligibility:', error);
    return 0;
  }
}

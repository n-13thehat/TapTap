import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ClaimAirdropSchema = z.object({
  campaignId: z.string().uuid(),
  merkleProof: z.array(z.string()).optional(), // For merkle tree campaigns
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { campaignId, merkleProof } = ClaimAirdropSchema.parse(body);

    // Get campaign and user eligibility
    const campaign = await prisma.airdropCampaign.findUnique({
      where: { id: campaignId },
      include: {
        eligibility: {
          where: { userId: session.user.id },
          include: { claim: true }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check campaign status and timing
    const now = new Date();
    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json({ error: "Campaign is not active" }, { status: 400 });
    }

    if (now < campaign.startDate) {
      return NextResponse.json({ error: "Campaign has not started yet" }, { status: 400 });
    }

    if (now > campaign.endDate) {
      return NextResponse.json({ error: "Campaign has ended" }, { status: 400 });
    }

    // Check user eligibility
    const eligibility = campaign.eligibility[0];
    if (!eligibility) {
      return NextResponse.json({ error: "You are not eligible for this airdrop" }, { status: 403 });
    }

    if (!eligibility.isEligible) {
      return NextResponse.json({ error: "Your eligibility has been revoked" }, { status: 403 });
    }

    if (eligibility.claim) {
      return NextResponse.json({ error: "You have already claimed this airdrop" }, { status: 400 });
    }

    // Verify merkle proof for merkle tree campaigns
    if (campaign.campaignType === 'MERKLE_TREE') {
      if (!merkleProof || merkleProof.length === 0) {
        return NextResponse.json({ error: "Merkle proof required" }, { status: 400 });
      }

      // Verify merkle proof (simplified - in production, use proper merkle tree verification)
      const isValidProof = verifyMerkleProof(
        eligibility.userId,
        eligibility.amount,
        merkleProof,
        campaign.merkleRoot || ''
      );

      if (!isValidProof) {
        return NextResponse.json({ error: "Invalid merkle proof" }, { status: 400 });
      }
    }

    // Apply anti-sybil checks
    if (campaign.antiSybilEnabled) {
      const sybilCheck = await performAntiSybilCheck(session.user.id, campaignId);
      if (!sybilCheck.passed) {
        return NextResponse.json({ 
          error: "Anti-sybil check failed", 
          reason: sybilCheck.reason 
        }, { status: 403 });
      }
    }

    // Process claim in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create claim record
      const claim = await tx.airdropClaim.create({
        data: {
          campaignId,
          userId: session.user.id,
          eligibilityId: eligibility.id,
          amount: eligibility.amount,
        }
      });

      // Credit user balance
      await tx.tapCoinTransaction.create({
        data: {
          userId: session.user.id,
          amount: eligibility.amount,
          reason: `AIRDROP_${campaign.name.toUpperCase().replace(/\s+/g, '_')}`
        }
      });

      // Update campaign claimed amount
      await tx.airdropCampaign.update({
        where: { id: campaignId },
        data: { claimedAmount: { increment: eligibility.amount } }
      });

      return claim;
    });

    return NextResponse.json({ 
      claim: result,
      amount: eligibility.amount,
      message: `Successfully claimed ${eligibility.amount} TAP tokens`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get user's airdrop eligibility
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const campaignId = url.searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    }

    const eligibility = await prisma.airdropEligibility.findUnique({
      where: { 
        campaignId_userId: { 
          campaignId, 
          userId: session.user.id 
        } 
      },
      include: {
        campaign: true,
        claim: true
      }
    });

    if (!eligibility) {
      return NextResponse.json({ error: "Not eligible for this campaign" }, { status: 404 });
    }

    const now = new Date();
    const campaign = eligibility.campaign;

    return NextResponse.json({
      eligible: eligibility.isEligible,
      amount: eligibility.amount,
      claimed: !!eligibility.claim,
      claimedAt: eligibility.claim?.claimedAt,
      canClaim: eligibility.isEligible && 
                !eligibility.claim && 
                campaign.status === 'ACTIVE' &&
                now >= campaign.startDate && 
                now <= campaign.endDate,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        campaignType: campaign.campaignType
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Simplified merkle proof verification (placeholder)
function verifyMerkleProof(userId: string, amount: number, proof: string[], root: string): boolean {
  // In production, implement proper merkle tree verification
  // This is a simplified placeholder
  return proof.length > 0 && root.length > 0;
}

// Anti-sybil check implementation
async function performAntiSybilCheck(userId: string, campaignId: string): Promise<{ passed: boolean; reason?: string }> {
  try {
    // Check for multiple claims from same IP (simplified)
    const recentClaims = await prisma.airdropClaim.count({
      where: {
        userId,
        claimedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (recentClaims > 5) {
      return { passed: false, reason: "Too many recent claims" };
    }

    // Check account age
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    });

    if (user) {
      const accountAgeInDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (accountAgeInDays < 7) {
        return { passed: false, reason: "Account too new" };
      }
    }

    return { passed: true };
  } catch (error) {
    return { passed: false, reason: "Anti-sybil check failed" };
  }
}

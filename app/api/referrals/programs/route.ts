import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateReferralSchema = z.object({
  referralCode: z.string().min(6).max(20),
});

// Get referral programs and user stats
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active referral programs
    const programs = await prisma.referralProgram.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { referrals: { where: { status: 'COMPLETED' } } }
        }
      }
    });

    // Get user's referral stats
    const userReferrals = await prisma.referral.findMany({
      where: { referrerId: session.user.id },
      include: {
        referee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            createdAt: true
          }
        },
        rewards: {
          where: { userId: session.user.id }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate user stats
    const totalReferrals = userReferrals.length;
    const completedReferrals = userReferrals.filter(r => r.status === 'COMPLETED').length;
    const totalEarned = userReferrals.reduce((sum, referral) => 
      sum + referral.rewards.reduce((rewardSum, reward) => rewardSum + reward.amount, 0), 0
    );
    const pendingRewards = userReferrals.reduce((sum, referral) => 
      sum + referral.rewards.filter(r => !r.claimedAt).reduce((rewardSum, reward) => rewardSum + reward.amount, 0), 0
    );

    // Generate user's referral code if they don't have one
    let userReferralCode = '';
    const existingReferral = await prisma.referral.findFirst({
      where: { referrerId: session.user.id },
      select: { referralCode: true }
    });

    if (existingReferral) {
      userReferralCode = existingReferral.referralCode;
    } else {
      // Generate unique referral code
      userReferralCode = await generateUniqueReferralCode(session.user.username || session.user.id);
    }

    return NextResponse.json({
      programs,
      userStats: {
        totalReferrals,
        completedReferrals,
        totalEarned,
        pendingRewards,
        referralCode: userReferralCode,
        conversionRate: totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0
      },
      referrals: userReferrals
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create referral (when someone uses a referral code)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { referralCode } = CreateReferralSchema.parse(body);

    // Check if user already has a referrer
    const existingReferral = await prisma.referral.findFirst({
      where: { refereeId: session.user.id }
    });

    if (existingReferral) {
      return NextResponse.json({ error: "You already have a referrer" }, { status: 400 });
    }

    // Find the referrer by code
    const referrerReferral = await prisma.referral.findFirst({
      where: { referralCode },
      include: { referrer: true, program: true }
    });

    if (!referrerReferral) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    // Can't refer yourself
    if (referrerReferral.referrerId === session.user.id) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Get active referral program
    const program = await prisma.referralProgram.findFirst({
      where: { isActive: true }
    });

    if (!program) {
      return NextResponse.json({ error: "No active referral program" }, { status: 400 });
    }

    // Create referral relationship
    const referral = await prisma.referral.create({
      data: {
        programId: program.id,
        referrerId: referrerReferral.referrerId,
        refereeId: session.user.id,
        referralCode: await generateUniqueReferralCode(session.user.username || session.user.id),
        status: 'ACTIVE',
        level: 1,
      },
      include: {
        referrer: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    // Create signup bonus reward
    await prisma.referralReward.create({
      data: {
        programId: program.id,
        referralId: referral.id,
        userId: referrerReferral.referrerId,
        amount: program.baseReward,
        rewardType: 'SIGNUP_BONUS',
        level: 1,
      }
    });

    // Credit referrer's balance
    await prisma.tapCoinTransaction.create({
      data: {
        userId: referrerReferral.referrerId,
        amount: program.baseReward,
        reason: `REFERRAL_SIGNUP_${session.user.username || 'USER'}`
      }
    });

    return NextResponse.json({ 
      referral,
      message: `Successfully joined referral program! ${referrerReferral.referrer.displayName} earned ${program.baseReward} TAP`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Generate unique referral code
async function generateUniqueReferralCode(username: string): Promise<string> {
  const baseCode = username.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
  let code = baseCode;
  let counter = 1;

  while (true) {
    const existing = await prisma.referral.findUnique({
      where: { referralCode: code }
    });

    if (!existing) {
      return code;
    }

    code = `${baseCode}${counter}`;
    counter++;

    if (counter > 999) {
      // Fallback to random code
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      break;
    }
  }

  return code;
}

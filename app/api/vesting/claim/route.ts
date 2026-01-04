import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ClaimVestingSchema = z.object({
  scheduleId: z.string().uuid(),
  amount: z.number().min(1).optional(), // Optional for partial claims
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { scheduleId, amount } = ClaimVestingSchema.parse(body);

    // Get vesting schedule
    const schedule = await prisma.vestingSchedule.findUnique({
      where: { 
        id: scheduleId,
        beneficiaryId: session.user.id,
        isRevoked: false
      },
      include: {
        releases: true,
        milestones: true
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: "Vesting schedule not found" }, { status: 404 });
    }

    const now = new Date();

    // Check if vesting has started
    if (now < schedule.startDate) {
      return NextResponse.json({ error: "Vesting has not started yet" }, { status: 400 });
    }

    // Check cliff period
    if (schedule.cliffDate && now < schedule.cliffDate) {
      return NextResponse.json({ error: "Still in cliff period" }, { status: 400 });
    }

    // Calculate vested amount
    let vestedAmount = 0;
    if (now >= schedule.endDate) {
      vestedAmount = schedule.totalAmount; // Fully vested
    } else {
      // Linear vesting calculation
      const vestingStart = schedule.cliffDate || schedule.startDate;
      const vestingDuration = schedule.endDate.getTime() - vestingStart.getTime();
      const vestingElapsed = Math.max(0, now.getTime() - vestingStart.getTime());
      vestedAmount = Math.floor((vestingElapsed / vestingDuration) * schedule.totalAmount);
    }

    const claimableAmount = Math.max(0, vestedAmount - schedule.claimedAmount);

    if (claimableAmount === 0) {
      return NextResponse.json({ error: "No tokens available to claim" }, { status: 400 });
    }

    // Determine claim amount
    const claimAmount = amount ? Math.min(amount, claimableAmount) : claimableAmount;

    // Process claim in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update vesting schedule
      await tx.vestingSchedule.update({
        where: { id: scheduleId },
        data: { claimedAmount: { increment: claimAmount } }
      });

      // Create vesting release record
      const release = await tx.vestingRelease.create({
        data: {
          scheduleId,
          amount: claimAmount,
          releaseDate: now,
          claimedAt: now,
          isAutomatic: false,
        }
      });

      // Credit user balance
      await tx.tapCoinTransaction.create({
        data: {
          userId: session.user.id,
          amount: claimAmount,
          reason: `VESTING_CLAIM_${schedule.name.toUpperCase().replace(/\s+/g, '_')}`
        }
      });

      return release;
    });

    return NextResponse.json({ 
      release: result,
      claimedAmount: claimAmount,
      remainingClaimable: claimableAmount - claimAmount,
      message: `Successfully claimed ${claimAmount} TAP tokens`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get claimable amount for a vesting schedule
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const scheduleId = url.searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json({ error: "scheduleId required" }, { status: 400 });
    }

    const schedule = await prisma.vestingSchedule.findUnique({
      where: { 
        id: scheduleId,
        beneficiaryId: session.user.id,
        isRevoked: false
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: "Vesting schedule not found" }, { status: 404 });
    }

    const now = new Date();

    // Calculate vested amount
    let vestedAmount = 0;
    let status = 'pending';

    if (now < schedule.startDate) {
      status = 'not_started';
    } else if (schedule.cliffDate && now < schedule.cliffDate) {
      status = 'cliff_period';
    } else if (now >= schedule.endDate) {
      vestedAmount = schedule.totalAmount;
      status = 'fully_vested';
    } else {
      const vestingStart = schedule.cliffDate || schedule.startDate;
      const vestingDuration = schedule.endDate.getTime() - vestingStart.getTime();
      const vestingElapsed = Math.max(0, now.getTime() - vestingStart.getTime());
      vestedAmount = Math.floor((vestingElapsed / vestingDuration) * schedule.totalAmount);
      status = 'vesting';
    }

    const claimableAmount = Math.max(0, vestedAmount - schedule.claimedAmount);
    const progressPercent = (vestedAmount / schedule.totalAmount) * 100;

    return NextResponse.json({
      scheduleId,
      totalAmount: schedule.totalAmount,
      vestedAmount,
      claimedAmount: schedule.claimedAmount,
      claimableAmount,
      remainingAmount: schedule.totalAmount - schedule.claimedAmount,
      progressPercent,
      status,
      canClaim: claimableAmount > 0,
      vestingStart: schedule.cliffDate || schedule.startDate,
      vestingEnd: schedule.endDate,
      cliffEnd: schedule.cliffDate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

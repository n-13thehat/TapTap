import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateVestingSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  beneficiaryId: z.string().uuid(),
  totalAmount: z.number().min(1),
  vestingType: z.enum(['LINEAR', 'CLIFF_THEN_LINEAR', 'MILESTONE_BASED', 'PERFORMANCE_BASED', 'HYBRID']),
  startDate: z.string().datetime(),
  cliffDate: z.string().datetime().optional(),
  endDate: z.string().datetime(),
  isRevocable: z.boolean().default(false),
  milestones: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    amount: z.number().min(1),
    condition: z.string(),
  })).optional(),
});

// Get vesting schedules
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const beneficiaryId = url.searchParams.get('beneficiaryId');
    const vestingType = url.searchParams.get('type');

    // Check if user is admin or requesting their own schedules
    const isAdmin = session.user.role === 'ADMIN';
    const where: any = {};

    if (beneficiaryId) {
      if (!isAdmin && beneficiaryId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      where.beneficiaryId = beneficiaryId;
    } else if (!isAdmin) {
      where.beneficiaryId = session.user.id;
    }

    if (vestingType) where.vestingType = vestingType;

    const schedules = await prisma.vestingSchedule.findMany({
      where,
      include: {
        beneficiary: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true
          }
        },
        releases: {
          orderBy: { releaseDate: 'asc' }
        },
        milestones: {
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            releases: { where: { claimedAt: { not: null } } },
            milestones: { where: { isCompleted: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate vesting progress for each schedule
    const schedulesWithProgress = schedules.map(schedule => {
      const now = new Date();
      const totalDuration = schedule.endDate.getTime() - schedule.startDate.getTime();
      const elapsed = Math.max(0, now.getTime() - schedule.startDate.getTime());
      const progressPercent = Math.min(100, (elapsed / totalDuration) * 100);

      // Calculate vested amount based on type
      let vestedAmount = 0;
      if (now >= schedule.startDate && !schedule.isRevoked) {
        if (schedule.cliffDate && now < schedule.cliffDate) {
          vestedAmount = 0; // Still in cliff period
        } else if (now >= schedule.endDate) {
          vestedAmount = schedule.totalAmount; // Fully vested
        } else {
          // Linear vesting calculation
          const vestingStart = schedule.cliffDate || schedule.startDate;
          const vestingDuration = schedule.endDate.getTime() - vestingStart.getTime();
          const vestingElapsed = Math.max(0, now.getTime() - vestingStart.getTime());
          vestedAmount = Math.floor((vestingElapsed / vestingDuration) * schedule.totalAmount);
        }
      }

      const claimableAmount = Math.max(0, vestedAmount - schedule.claimedAmount);

      return {
        ...schedule,
        progressPercent,
        vestedAmount,
        claimableAmount,
        remainingAmount: schedule.totalAmount - schedule.claimedAmount,
        isActive: !schedule.isRevoked && now >= schedule.startDate && now <= schedule.endDate,
        releasesCompleted: schedule._count.releases,
        milestonesCompleted: schedule._count.milestones
      };
    });

    return NextResponse.json({ schedules: schedulesWithProgress });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create vesting schedule (Admin only)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const data = CreateVestingSchema.parse(body);

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const cliffDate = data.cliffDate ? new Date(data.cliffDate) : null;

    if (endDate <= startDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    if (cliffDate && (cliffDate <= startDate || cliffDate >= endDate)) {
      return NextResponse.json({ error: "Cliff date must be between start and end dates" }, { status: 400 });
    }

    // Verify beneficiary exists
    const beneficiary = await prisma.user.findUnique({
      where: { id: data.beneficiaryId }
    });

    if (!beneficiary) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    // Create vesting schedule in transaction
    const result = await prisma.$transaction(async (tx) => {
      const schedule = await tx.vestingSchedule.create({
        data: {
          name: data.name,
          description: data.description,
          beneficiaryId: data.beneficiaryId,
          totalAmount: data.totalAmount,
          vestingType: data.vestingType as any,
          startDate,
          cliffDate,
          endDate,
          isRevocable: data.isRevocable,
        },
        include: {
          beneficiary: {
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true
            }
          }
        }
      });

      // Create milestones if provided
      if (data.milestones && data.milestones.length > 0) {
        await tx.vestingMilestone.createMany({
          data: data.milestones.map(milestone => ({
            scheduleId: schedule.id,
            name: milestone.name,
            description: milestone.description,
            amount: milestone.amount,
            condition: milestone.condition,
          }))
        });
      }

      return schedule;
    });

    return NextResponse.json({ schedule: result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

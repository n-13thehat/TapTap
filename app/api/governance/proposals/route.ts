import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateProposalSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(5000),
  type: z.enum(['PARAMETER_CHANGE', 'TREASURY_SPEND', 'FEATURE_REQUEST', 'PLATFORM_UPGRADE', 'FEE_ADJUSTMENT', 'PARTNERSHIP', 'EMERGENCY']),
  votingDuration: z.number().min(24).max(168), // 1-7 days in hours
  executionData: z.record(z.any()).optional(),
});

// Get all proposals
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        proposer: {
          select: { id: true, username: true, displayName: true }
        },
        _count: {
          select: { votes: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.proposal.count({ where });

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create new proposal
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateProposalSchema.parse(body);

    // Check if user has minimum TAP balance to create proposals (e.g., 1000 TAP)
    const userBalance = await prisma.tapCoinTransaction.aggregate({
      where: { userId: session.user.id },
      _sum: { amount: true }
    });

    const balance = userBalance._sum.amount || 0;
    const minProposalBalance = parseInt(process.env.MIN_PROPOSAL_BALANCE || '1000');

    if (balance < minProposalBalance) {
      return NextResponse.json({ 
        error: `Minimum ${minProposalBalance} TAP required to create proposals` 
      }, { status: 403 });
    }

    // Calculate voting end time
    const votingEndsAt = new Date();
    votingEndsAt.setHours(votingEndsAt.getHours() + validatedData.votingDuration);

    const proposal = await prisma.proposal.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type as any,
        proposerId: session.user.id,
        votingEndsAt,
        executionData: validatedData.executionData || {},
      },
      include: {
        proposer: {
          select: { id: true, username: true, displayName: true }
        }
      }
    });

    return NextResponse.json({ proposal });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

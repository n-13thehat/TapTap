import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VoteSchema = z.object({
  vote: z.enum(['FOR', 'AGAINST', 'ABSTAIN']),
  reason: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: proposalId } = await params;
    const body = await req.json();
    const { vote, reason } = VoteSchema.parse(body);

    // Get proposal and check if voting is still active
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { votes: { where: { voterId: session.user.id } } }
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.status !== 'ACTIVE' && proposal.status !== 'PENDING') {
      return NextResponse.json({ error: "Voting is closed" }, { status: 400 });
    }

    if (new Date() > proposal.votingEndsAt) {
      return NextResponse.json({ error: "Voting period has ended" }, { status: 400 });
    }

    // Check if user already voted
    if (proposal.votes.length > 0) {
      return NextResponse.json({ error: "You have already voted on this proposal" }, { status: 400 });
    }

    // Calculate user's voting power based on TAP balance
    const userBalance = await prisma.tapCoinTransaction.aggregate({
      where: { userId: session.user.id },
      _sum: { amount: true }
    });

    let votingPower = Math.max(userBalance._sum.amount || 0, 0);

    // Check for delegated voting power
    const delegations = await prisma.voteDelegation.findMany({
      where: { 
        delegateId: session.user.id,
        isActive: true,
        revokedAt: null
      }
    });

    const delegatedPower = delegations.reduce((sum, delegation) => sum + delegation.votingPower, 0);
    votingPower += delegatedPower;

    if (votingPower === 0) {
      return NextResponse.json({ error: "No voting power available" }, { status: 403 });
    }

    // Create vote
    const proposalVote = await prisma.proposalVote.create({
      data: {
        proposalId,
        voterId: session.user.id,
        vote: vote as any,
        votingPower,
        reason,
      }
    });

    // Update proposal vote counts
    const updateData: any = {};
    if (vote === 'FOR') updateData.votesFor = { increment: votingPower };
    else if (vote === 'AGAINST') updateData.votesAgainst = { increment: votingPower };
    else updateData.votesAbstain = { increment: votingPower };

    await prisma.proposal.update({
      where: { id: proposalId },
      data: updateData
    });

    // Check if quorum is reached and update proposal status
    await checkQuorumAndUpdateStatus(proposalId);

    return NextResponse.json({ vote: proposalVote });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function checkQuorumAndUpdateStatus(proposalId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId }
  });

  if (!proposal) return;

  const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const quorumThreshold = parseInt(process.env.GOVERNANCE_QUORUM_THRESHOLD || '100000'); // 100k TAP

  if (totalVotes >= quorumThreshold) {
    const status = proposal.votesFor > proposal.votesAgainst ? 'SUCCEEDED' : 'DEFEATED';
    
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        quorumReached: true,
        status: status as any
      }
    });
  }
}

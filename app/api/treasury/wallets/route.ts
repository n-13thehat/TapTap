import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateTransactionSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.number().min(1),
  transactionType: z.enum(['WITHDRAWAL', 'ALLOCATION', 'GRANT', 'REWARD_DISTRIBUTION', 'EMERGENCY_SPEND', 'DEVELOPMENT_PAYMENT', 'MARKETING_SPEND']),
  description: z.string().min(1),
  recipient: z.string().optional(),
  proposalId: z.string().uuid().optional(),
});

// Get treasury wallets and their status
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallets = await prisma.treasuryWallet.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { 
            transactions: { where: { status: 'EXECUTED' } },
          }
        },
        allocations: {
          where: { isActive: true },
          orderBy: { startDate: 'desc' }
        },
        transactions: {
          where: { status: { in: ['PENDING', 'PARTIALLY_SIGNED'] } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            initiator: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: { walletType: 'asc' }
    });

    // Calculate wallet metrics
    const walletsWithMetrics = await Promise.all(
      wallets.map(async (wallet) => {
        // Get recent transaction volume (last 30 days)
        const recentVolume = await prisma.treasuryTransaction.aggregate({
          where: {
            walletId: wallet.id,
            status: 'EXECUTED',
            executedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          _sum: { amount: true }
        });

        // Calculate allocation utilization
        const totalAllocated = wallet.allocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
        const totalSpent = wallet.allocations.reduce((sum, alloc) => sum + alloc.spentAmount, 0);
        const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

        // Check if user is a signatory
        const signatories = Array.isArray(wallet.signatories) ? wallet.signatories : [];
        const isSignatory = signatories.includes(session.user.id);

        return {
          ...wallet,
          metrics: {
            monthlyVolume: recentVolume._sum.amount || 0,
            totalTransactions: wallet._count.transactions,
            utilizationRate,
            totalAllocated,
            totalSpent,
            pendingTransactions: wallet.transactions.length
          },
          userPermissions: {
            isSignatory,
            canInitiate: isSignatory || session.user.role === 'ADMIN',
            canSign: isSignatory
          }
        };
      })
    );

    // Get overall treasury stats
    const totalTreasuryBalance = walletsWithMetrics.reduce((sum, wallet) => sum + wallet.balance, 0);
    const totalPendingTransactions = walletsWithMetrics.reduce((sum, wallet) => sum + wallet.metrics.pendingTransactions, 0);

    return NextResponse.json({
      wallets: walletsWithMetrics,
      summary: {
        totalBalance: totalTreasuryBalance,
        totalWallets: walletsWithMetrics.length,
        pendingTransactions: totalPendingTransactions,
        activeAllocations: walletsWithMetrics.reduce((sum, wallet) => sum + wallet.allocations.length, 0)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Initiate treasury transaction
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { walletId, amount, transactionType, description, recipient, proposalId } = CreateTransactionSchema.parse(body);

    // Get wallet details
    const wallet = await prisma.treasuryWallet.findUnique({
      where: { id: walletId, isActive: true }
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found or inactive" }, { status: 404 });
    }

    // Check if user can initiate transactions
    const signatories = Array.isArray(wallet.signatories) ? wallet.signatories : [];
    const isSignatory = signatories.includes(session.user.id);
    const canInitiate = isSignatory || session.user.role === 'ADMIN';

    if (!canInitiate) {
      return NextResponse.json({ error: "Insufficient permissions to initiate treasury transactions" }, { status: 403 });
    }

    // Check wallet balance for withdrawals
    if (['WITHDRAWAL', 'GRANT', 'REWARD_DISTRIBUTION', 'EMERGENCY_SPEND', 'DEVELOPMENT_PAYMENT', 'MARKETING_SPEND'].includes(transactionType)) {
      if (wallet.balance < amount) {
        return NextResponse.json({ 
          error: "Insufficient wallet balance",
          available: wallet.balance,
          requested: amount
        }, { status: 400 });
      }
    }

    // Validate proposal if provided
    if (proposalId) {
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId, status: 'APPROVED' }
      });

      if (!proposal) {
        return NextResponse.json({ error: "Invalid or unapproved proposal" }, { status: 400 });
      }
    }

    // Create treasury transaction
    const transaction = await prisma.treasuryTransaction.create({
      data: {
        walletId,
        proposalId,
        amount,
        transactionType,
        description,
        recipient,
        requiredSignatures: wallet.minSignatures,
        initiatedBy: session.user.id,
        signatures: JSON.stringify([{
          userId: session.user.id,
          signedAt: new Date().toISOString(),
          signature: `init_${Math.random().toString(36).substring(2, 15)}`
        }])
      },
      include: {
        wallet: true,
        initiator: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    // Check if transaction is automatically approved (single signature required)
    if (wallet.minSignatures <= 1) {
      await prisma.treasuryTransaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'FULLY_SIGNED',
          approvedAt: new Date()
        }
      });

      // Execute transaction if it's a withdrawal
      if (['WITHDRAWAL', 'GRANT', 'REWARD_DISTRIBUTION', 'EMERGENCY_SPEND', 'DEVELOPMENT_PAYMENT', 'MARKETING_SPEND'].includes(transactionType)) {
        await executeTreasuryTransaction(transaction.id);
      }
    }

    return NextResponse.json({ 
      transaction,
      message: `Treasury transaction initiated. ${wallet.minSignatures > 1 ? `Requires ${wallet.minSignatures - 1} more signatures.` : 'Transaction approved and executed.'}`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Execute treasury transaction (simulate blockchain execution)
async function executeTreasuryTransaction(transactionId: string) {
  try {
    const transaction = await prisma.treasuryTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true }
    });

    if (!transaction || transaction.status !== 'FULLY_SIGNED') {
      return;
    }

    // Update wallet balance
    await prisma.treasuryWallet.update({
      where: { id: transaction.walletId },
      data: { balance: { decrement: transaction.amount } }
    });

    // Mark transaction as executed
    await prisma.treasuryTransaction.update({
      where: { id: transactionId },
      data: { 
        status: 'EXECUTED',
        executedAt: new Date(),
        txHash: `0x${Math.random().toString(16).substring(2, 66)}` // Mock tx hash
      }
    });

    // If there's a recipient user, credit their balance
    if (transaction.recipient && transaction.recipient.length === 36) { // UUID format
      await prisma.tapCoinTransaction.create({
        data: {
          userId: transaction.recipient,
          amount: transaction.amount,
          reason: `TREASURY_${transaction.transactionType}`
        }
      });
    }
  } catch (error) {
    console.error('Treasury transaction execution failed:', error);
    
    await prisma.treasuryTransaction.update({
      where: { id: transactionId },
      data: { 
        status: 'REJECTED'
      }
    });
  }
}

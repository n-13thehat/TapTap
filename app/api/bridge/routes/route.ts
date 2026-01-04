import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const InitiateBridgeSchema = z.object({
  bridgeId: z.string().uuid(),
  amount: z.number().min(1),
  targetAddress: z.string().min(1), // Target chain wallet address
});

// Get available bridge routes
export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const sourceChain = url.searchParams.get('sourceChain');
    const targetChain = url.searchParams.get('targetChain');

    const where: any = { isActive: true };
    if (sourceChain) where.sourceChain = sourceChain;
    if (targetChain) where.targetChain = targetChain;

    const bridges = await prisma.crossChainBridge.findMany({
      where,
      include: {
        _count: {
          select: { 
            transfers: { 
              where: { 
                status: 'COMPLETED',
                completedAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              } 
            } 
          }
        }
      },
      orderBy: { estimatedTime: 'asc' }
    });

    // Calculate bridge metrics
    const bridgesWithMetrics = await Promise.all(
      bridges.map(async (bridge) => {
        // Get recent transfer stats
        const recentTransfers = await prisma.crossChainTransfer.findMany({
          where: {
            bridgeId: bridge.id,
            initiatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          select: {
            status: true,
            initiatedAt: true,
            completedAt: true
          }
        });

        const totalTransfers = recentTransfers.length;
        const completedTransfers = recentTransfers.filter(t => t.status === 'COMPLETED').length;
        const successRate = totalTransfers > 0 ? (completedTransfers / totalTransfers) * 100 : 100;

        // Calculate average completion time
        const completedWithTimes = recentTransfers.filter(t => t.completedAt && t.status === 'COMPLETED');
        const avgCompletionTime = completedWithTimes.length > 0
          ? completedWithTimes.reduce((sum, t) => {
              const duration = t.completedAt!.getTime() - t.initiatedAt.getTime();
              return sum + duration;
            }, 0) / completedWithTimes.length / 1000 // Convert to seconds
          : bridge.estimatedTime;

        // Calculate total volume (last 24h)
        const dailyVolume = await prisma.crossChainTransfer.aggregate({
          where: {
            bridgeId: bridge.id,
            status: 'COMPLETED',
            completedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          _sum: { amount: true }
        });

        return {
          ...bridge,
          metrics: {
            successRate,
            avgCompletionTime: Math.round(avgCompletionTime),
            dailyVolume: dailyVolume._sum.amount || 0,
            dailyTransfers: bridge._count.transfers,
            totalTransfers
          }
        };
      })
    );

    return NextResponse.json({ bridges: bridgesWithMetrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Initiate cross-chain transfer
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bridgeId, amount, targetAddress } = InitiateBridgeSchema.parse(body);

    // Get bridge details
    const bridge = await prisma.crossChainBridge.findUnique({
      where: { id: bridgeId, isActive: true }
    });

    if (!bridge) {
      return NextResponse.json({ error: "Bridge not found or inactive" }, { status: 404 });
    }

    // Validate amount
    if (amount < bridge.minAmount) {
      return NextResponse.json({ 
        error: `Minimum bridge amount is ${bridge.minAmount} TAP` 
      }, { status: 400 });
    }

    if (amount > bridge.maxAmount) {
      return NextResponse.json({ 
        error: `Maximum bridge amount is ${bridge.maxAmount} TAP` 
      }, { status: 400 });
    }

    // Check user balance (including bridge fee)
    const totalRequired = amount + bridge.bridgeFee;
    const userBalance = await prisma.tapCoinTransaction.aggregate({
      where: { userId: session.user.id },
      _sum: { amount: true }
    });

    const balance = userBalance._sum.amount || 0;
    if (balance < totalRequired) {
      return NextResponse.json({ 
        error: "Insufficient TAP balance",
        required: totalRequired,
        available: balance,
        bridgeFee: bridge.bridgeFee
      }, { status: 400 });
    }

    // Initiate bridge transfer
    const result = await prisma.$transaction(async (tx) => {
      // Create transfer record
      const transfer = await tx.crossChainTransfer.create({
        data: {
          bridgeId,
          userId: session.user.id,
          amount,
          bridgeFee: bridge.bridgeFee,
          sourceChain: bridge.sourceChain,
          targetChain: bridge.targetChain,
          status: 'PENDING',
        },
        include: { bridge: true }
      });

      // Debit user balance (amount + fee)
      await tx.tapCoinTransaction.create({
        data: {
          userId: session.user.id,
          amount: -totalRequired,
          reason: `BRIDGE_${bridge.sourceChain.toUpperCase()}_TO_${bridge.targetChain.toUpperCase()}`
        }
      });

      return transfer;
    });

    // In a real implementation, this would trigger the actual bridge transaction
    // For now, we'll simulate the bridge process
    setTimeout(async () => {
      await simulateBridgeProcess(result.id, targetAddress);
    }, 1000);

    return NextResponse.json({ 
      transfer: result,
      estimatedTime: bridge.estimatedTime,
      message: `Bridge transfer initiated. Estimated completion: ${Math.round(bridge.estimatedTime / 60)} minutes`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Simulate bridge process (in production, this would be handled by bridge infrastructure)
async function simulateBridgeProcess(transferId: string, targetAddress: string) {
  try {
    // Simulate confirmation delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    await prisma.crossChainTransfer.update({
      where: { id: transferId },
      data: { 
        status: 'CONFIRMED',
        sourceTxHash: `0x${Math.random().toString(16).substring(2, 66)}` // Mock tx hash
      }
    });

    // Simulate bridging delay
    await new Promise(resolve => setTimeout(resolve, 30000));

    await prisma.crossChainTransfer.update({
      where: { id: transferId },
      data: { 
        status: 'BRIDGING'
      }
    });

    // Simulate completion delay
    await new Promise(resolve => setTimeout(resolve, 60000));

    await prisma.crossChainTransfer.update({
      where: { id: transferId },
      data: { 
        status: 'COMPLETED',
        targetTxHash: `0x${Math.random().toString(16).substring(2, 66)}`, // Mock tx hash
        completedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Bridge simulation failed:', error);
    
    await prisma.crossChainTransfer.update({
      where: { id: transferId },
      data: { 
        status: 'FAILED',
        failedAt: new Date(),
        errorMessage: 'Bridge simulation failed'
      }
    });
  }
}

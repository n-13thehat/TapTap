import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const WalletBody = z.object({
  action: z.enum(["connect", "disconnect"]),
  walletAddress: z.string().trim().min(32).max(64).optional(),
  signature: z.string().trim().min(1).max(512).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = WalletBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
    }
    const { action, walletAddress, signature } = parsed.data;

    if (action === 'connect') {
      if (!walletAddress) {
        return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
      }

      // In a real implementation, verify the signature here
      // const isValidSignature = await verifyWalletSignature(walletAddress, signature);
      // if (!isValidSignature) {
      //   return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      // }

      // Update user with wallet address
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          walletAddress,
          updatedAt: new Date(),
        },
      });

      // Log wallet connection
      console.log(`Wallet connected for user ${session.user.id}: ${walletAddress}`);

      return NextResponse.json({
        success: true,
        walletAddress,
        message: "Wallet connected successfully",
      });

    } else if (action === 'disconnect') {
      // Remove wallet address from user
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          walletAddress: null,
          updatedAt: new Date(),
        },
      });

      console.log(`Wallet disconnected for user ${session.user.id}`);

      return NextResponse.json({
        success: true,
        message: "Wallet disconnected successfully",
      });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error('Wallet operation error:', error);
    return NextResponse.json(
      { error: "Failed to process wallet operation" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        walletAddress: true,
      },
    });

    return NextResponse.json({
      walletAddress: (user as any)?.walletAddress || null,
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: "Failed to get wallet info" },
      { status: 500 }
    );
  }
}

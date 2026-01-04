import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, walletAddress, signature } = body;

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

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
    const { username, creatorMode, walletAddress, twoFactorEnabled } = body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(username && { username }),
        ...(typeof creatorMode === 'boolean' && { creatorMode }),
        ...(walletAddress && { walletAddress }),
        ...(typeof twoFactorEnabled === 'boolean' && { twoFactorEnabled }),
        updatedAt: new Date(),
      },
    });

    // Log the profile update
    console.log(`Profile updated for user ${session.user.id}:`, {
      username,
      creatorMode,
      walletAddress: walletAddress ? '***' : null,
      twoFactorEnabled,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        creatorMode: (updatedUser as any).creatorMode,
        walletAddress: (updatedUser as any).walletAddress,
        twoFactorEnabled: (updatedUser as any).twoFactorEnabled,
      },
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

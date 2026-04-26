import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const UpdateProfileBody = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  creatorMode: z.boolean().optional(),
  walletAddress: z.string().trim().min(32).max(64).optional(),
  twoFactorEnabled: z.boolean().optional(),
}).refine((v) => Object.values(v).some((x) => x !== undefined), {
  message: "At least one field must be provided",
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = UpdateProfileBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
    }
    const { username, creatorMode, walletAddress, twoFactorEnabled } = parsed.data;

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

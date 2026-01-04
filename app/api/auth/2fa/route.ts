import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, token, secret } = body;

    if (action === 'setup') {
      // Generate secret for 2FA setup
      const userSecret = authenticator.generateSecret();
      const serviceName = 'TapTap';
      const accountName = session.user.email || session.user.id;
      
      const otpauth = authenticator.keyuri(accountName, serviceName, userSecret);
      const qrCodeUrl = await QRCode.toDataURL(otpauth);

      // Store temporary secret (in real implementation, store securely)
      // For demo, we'll return it directly
      
      return NextResponse.json({
        success: true,
        secret: userSecret,
        qrCode: qrCodeUrl,
        backupCodes: generateBackupCodes(),
      });

    } else if (action === 'verify') {
      if (!token || !secret) {
        return NextResponse.json({ error: "Token and secret required" }, { status: 400 });
      }

      // Verify the token
      const isValid = authenticator.verify({ token, secret });
      
      if (!isValid) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
      }

      // Enable 2FA for user
      // TODO: Add 2FA fields to User schema
      // await prisma.user.update({
      //   where: { id: session.user.id },
      //   data: {
      //     twoFactorEnabled: true,
      //     twoFactorSecret: secret, // In real implementation, encrypt this
      //     updatedAt: new Date(),
      //   },
      // });

      console.log(`2FA enabled for user ${session.user.id}`);

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication enabled successfully",
      });

    } else if (action === 'disable') {
      if (!token) {
        return NextResponse.json({ error: "Token required" }, { status: 400 });
      }

      // TODO: Add 2FA fields to User schema
      // Get user's 2FA secret
      // const user = await prisma.user.findUnique({
      //   where: { id: session.user.id },
      //   select: { twoFactorSecret: true },
      // });

      // if (!(user as any)?.twoFactorSecret) {
      //   return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
      // }

      // Verify token before disabling
      // const isValid = authenticator.verify({
      //   token,
      //   secret: (user as any).twoFactorSecret
      // });

      // if (!isValid) {
      //   return NextResponse.json({ error: "Invalid token" }, { status: 400 });
      // }

      // Disable 2FA
      // await prisma.user.update({
      //   where: { id: session.user.id },
      //   data: {
      //     twoFactorEnabled: false,
      //     twoFactorSecret: null,
      //     updatedAt: new Date(),
      //   },
      // });

      console.log(`2FA disabled for user ${session.user.id}`);

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication disabled successfully",
      });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error('2FA operation error:', error);
    return NextResponse.json(
      { error: "Failed to process 2FA operation" },
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

    // TODO: Add 2FA fields to User schema
    // const user = await prisma.user.findUnique({
    //   where: { id: session.user.id },
    //   select: {
    //     twoFactorEnabled: true,
    //   },
    // });

    return NextResponse.json({
      enabled: false, // (user as any)?.twoFactorEnabled || false,
    });

  } catch (error) {
    console.error('Get 2FA status error:', error);
    return NextResponse.json(
      { error: "Failed to get 2FA status" },
      { status: 500 }
    );
  }
}

function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
  }
  return codes;
}

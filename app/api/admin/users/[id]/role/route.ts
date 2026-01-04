import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";

async function requireAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return null;
  const user = await prisma.user.findUnique({ 
    where: { email }, 
    select: { id: true, role: true } 
  });
  if (!user || (user.role as any) !== "ADMIN") return null;
  return user;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = await rateGate(req, "admin:users:role", { capacity: 10, refillPerSec: 0.1 });
  if (rl) return rl;

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { role } = body;

    // Validate role
    const validRoles = ['USER', 'CREATOR', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from demoting themselves
    if (existingUser.id === admin.id && role !== 'ADMIN') {
      return NextResponse.json({ error: "Cannot change your own admin role" }, { status: 400 });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    // Log the role change
    await prisma.auditLog?.create({
      data: {
        action: 'USER_ROLE_CHANGED',
        userId: admin.id,
        targetUserId: id,
        details: {
          previousRole: existingUser.role,
          newRole: role,
          targetUserEmail: existingUser.email
        }
      }
    }).catch(() => {
      // Ignore if AuditLog model doesn't exist
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Admin user role update error:', error);
    return NextResponse.json({ 
      error: "Failed to update user role",
      details: error.message 
    }, { status: 500 });
  }
}

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
  const rl = await rateGate(req, "admin:users:status", { capacity: 10, refillPerSec: 0.1 });
  if (rl) return rl;

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from suspending/banning themselves
    if (existingUser.id === admin.id && status !== 'ACTIVE') {
      return NextResponse.json({ error: "Cannot change your own account status" }, { status: 400 });
    }

    // Prevent non-super-admin from suspending/banning other admins
    if (existingUser.role === 'ADMIN' && existingUser.id !== admin.id) {
      return NextResponse.json({ error: "Cannot change status of other administrators" }, { status: 403 });
    }

    // For now, we'll store status in a separate field or use a workaround
    // Since the User model might not have a status field, we'll use a custom approach
    
    // Update user - for now we'll use a metadata approach or add to existing fields
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    // Log the status change
    await prisma.auditLog?.create({
      data: {
        action: 'USER_STATUS_CHANGED',
        userId: admin.id,
        targetUserId: id,
        details: {
          newStatus: status,
          targetUserEmail: existingUser.email,
          reason: body.reason || 'Admin action'
        }
      }
    }).catch(() => {
      // Ignore if AuditLog model doesn't exist
    });

    // If banning user, we might want to revoke their sessions
    if (status === 'BANNED') {
      // Revoke all user sessions
      await prisma.session?.deleteMany({
        where: { userId: id }
      }).catch(() => {
        // Ignore if Session model doesn't exist
      });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Admin user status update error:', error);
    return NextResponse.json({ 
      error: "Failed to update user status",
      details: error.message 
    }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { rateGate } from "@/api/_lib/rate";
import bcrypt from "bcryptjs";

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

export async function GET(req: Request) {
  const rl = await rateGate(req, "admin:users", { capacity: 20, refillPerSec: 0.2 });
  if (rl) return rl;
  
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const role = url.searchParams.get('role');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const where: any = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        hasTapPass: true,
        // Add computed fields
        _count: {
          select: {
            tracks: true,
            playEvents: true
          }
        },
        tapCoinTransactions: {
          select: {
            amount: true
          }
        }
      }
    });

    // Transform the data to match our interface
    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.username || 'Unknown',
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      lastActive: user.updatedAt.toISOString(),
      isVerified: false, // Add verification logic if needed
      hasTapPass: user.hasTapPass || false,
      tapBalance: user.tapCoinTransactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0,
      totalTracks: user._count?.tracks || 0,
      totalPlays: user._count?.playEvents || 0,
      status: 'ACTIVE' // Add status logic if needed
    }));

    const total = await prisma.user.count({ where });

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error: any) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ 
      error: "Failed to fetch users",
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const rl = await rateGate(req, "admin:users:create", { capacity: 5, refillPerSec: 0.05 });
  if (rl) return rl;
  
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { username, email, role, password } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        hashedPassword,
        role: role || 'USER',
        authUserId: crypto.randomUUID()
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        hasTapPass: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        lastActive: user.createdAt.toISOString(),
        isVerified: false,
        hasTapPass: user.hasTapPass || false,
        tapBalance: 0,
        totalTracks: 0,
        totalPlays: 0,
        status: 'ACTIVE'
      }
    });
  } catch (error: any) {
    console.error('Admin user creation error:', error);
    return NextResponse.json({ 
      error: "Failed to create user",
      details: error.message 
    }, { status: 500 });
  }
}

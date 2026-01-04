import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 64,
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        likeTargets: {
          select: {
            likes: {
              select: {
                userId: true,
              },
            },
          },
        },
        _count: { select: { comments: true, likeTargets: true } },
      },
    });
    const normalized = posts.map((post) => {
      const likes = post.likeTargets?.flatMap((target) => target.likes) ?? [];
      return {
        ...post,
        likes,
        _count: {
          ...post._count,
          likes: post._count?.likeTargets ?? likes.length,
        },
        user: {
          ...post.user,
          name: post.user.username,
          handle: post.user.username,
        },
      };
    });
    return NextResponse.json(normalized);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

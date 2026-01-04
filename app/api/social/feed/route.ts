import { NextResponse } from "next/server";
import { rateGate } from "../../_lib/rate";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const gate = await rateGate(req, "social:feed", { capacity: 40, refillPerSec: 1 });
  if (gate) return gate;
  try {
    const session = await auth();
    // Narrow types defensively
    const email = (session as any)?.user?.email as string | undefined;
    const user = email
      ? await prisma.user.findUnique({ where: { email } })
      : null;
    const userId = user?.id;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const followingOnly = (searchParams.get("followingOnly") || "false").toLowerCase() === "true";
    const cursor = searchParams.get("cursor") || ""; // older than
    const after = searchParams.get("after") || "";   // newer than

    let authorFilter: string[] | undefined = undefined;
    if (followingOnly && userId) {
      const follows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
      authorFilter = follows.map((f) => f.followingId);
      if (authorFilter.length === 0) {
        return NextResponse.json({ items: [], nextCursor: null });
      }
    }

    const useAfter = !!after && !cursor; // don't mix both directions
    const posts = await prisma.post.findMany({
      where: {
        deletedAt: null,
        ...(authorFilter ? { userId: { in: authorFilter } } : {}),
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
        ...(useAfter ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: useAfter ? "asc" : "desc" },
      take: limit,
      include: {
        user: { select: { id: true, username: true, name: true, avatarUrl: true, image: true, profile: true } } as any,
        comments: { select: { id: true } },
        likeTargets: { select: { id: true, likes: { select: { id: true, userId: true } } } },
        reposts: { select: { id: true } },
      },
    });

    let items = posts.map((p) => ({
      id: p.id,
      authorId: p.userId,
      content: p.text ?? "",
      createdAt: p.createdAt.toISOString(),
      mediaUrl: p.mediaUrl ?? null,
      _count: { comments: p.comments.length, likes: (p.likeTargets[0]?.likes?.length ?? 0), reposts: p.reposts.length },
      author: {
        id: (p as any).user?.id,
        username: (p as any).user?.username ?? null,
        name: (p as any).user?.name ?? null,
        image: (p as any).user?.image ?? (p as any).user?.avatarUrl ?? null,
        profile: (p as any).user?.profile ?? null,
      },
      likedByMe: !!(userId && p.likeTargets[0]?.likes?.some((l: any) => l.userId === userId)),
    }));

    if (useAfter) {
      // Ensure newest-first when returning newer items
      items = items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    const nextCursor = !useAfter && items.length === limit ? items[items.length - 1].createdAt : null;
    return NextResponse.json({ items, nextCursor });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}



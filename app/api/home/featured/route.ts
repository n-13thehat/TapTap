import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Block<T> = { title: string; href: string; items: T[] };

export async function GET() {
  try {
    const [posts, tracks, products, live, posterize] = await Promise.all([
      prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { username: true } } } }).catch(() => []),
      prisma.track.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { artist: { select: { stageName: true } } } }).catch(() => []),
      prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 6 }).catch(() => []),
      prisma.liveStream.findMany({ orderBy: { startedAt: "desc" }, take: 6 }).catch(() => []),
      prisma.product.findMany({ where: { desc: { contains: "Posterize" } }, orderBy: { createdAt: "desc" }, take: 6 }).catch(() => []),
    ]);

    // Battles: pull via internal API (if YT key present)
    let battles: any[] = [];
    try {
      const key = process.env.YOUTUBE_API_KEY;
      if (key) {
        const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/battles?sort=popular&maxResults=6`, { cache: "no-store" }).catch(() => null);
        const j = r ? await r.json().catch(() => null) : null;
        battles = Array.isArray(j?.items) ? j!.items : [];
      }
    } catch {}

    const social: Block<any> = { title: "Social", href: "/social?embed=1", items: posts.map((p: any) => ({ id: p.id, text: p.text || p.content, createdAt: p.createdAt, user: { username: p.user?.username || "user" } })) };
    const library: Block<any> = { title: "Library", href: "/library?embed=1", items: tracks.map((t: any) => ({ id: t.id, title: t.title, createdAt: t.createdAt, artist: { stageName: t.artist?.stageName || "Artist" } })) };
    const creator: Block<any> = { title: "Creator", href: "/creator?embed=1", items: tracks.slice(0, 3).map((t: any) => ({ id: t.id, title: t.title, createdAt: t.createdAt, artist: { stageName: t.artist?.stageName || "Artist" } })) };
    const marketplace: Block<any> = { title: "Marketplace", href: "/marketplace?embed=1", items: products.map((p: any) => ({ id: p.id, title: p.title, priceCents: p.totalCents || p.priceCents || 0, createdAt: p.createdAt })) };
    const battlesBlock: Block<any> = { title: "Battles", href: "/battles?embed=1", items: battles };
    const posterizeBlock: Block<any> = { title: "Posterize", href: "/posterize?embed=1", items: posterize.map((p: any) => ({ id: p.id, title: p.title, priceCents: p.priceCents, createdAt: p.createdAt })) };
    const liveBlock: Block<any> = { title: "Live", href: "/live?embed=1", items: live.map((s: any) => ({ id: s.id, title: s.title, startedAt: s.startedAt })) };
    const surf: Block<any> = { title: "Surf", href: "/surf?embed=1", items: [] };

    const counts = {
      social: posts.length,
      library: tracks.length,
      marketplace: products.length,
      battles: battles.length,
      live: live.length,
      surf: 0,
    };

    return NextResponse.json({ social, library, creator, marketplace, battles: battlesBlock, posterize: posterizeBlock, live: liveBlock, surf, counts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}



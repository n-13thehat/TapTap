import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ytFetch } from "../surf/_lib/youtube";
import { getServerFlags } from "@/lib/features";

type SearchItem = {
  type: string;
  id: string;
  title: string;
  href?: string;
  audio_url?: string;
  artist?: string;
  thumbnail?: string;
  duration?: string;
  isYoutube?: boolean;
  actions?: string[];
};

const MAX_RESULTS_PER_SECTION = 5;
const MAX_TOTAL_RESULTS = 25;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const requestYoutube = searchParams.get("youtube") === "true";
    if (!q) {
      return NextResponse.json({ items: [], meta: { allowShadowTracks: false } });
    }

    const flags = getServerFlags(req.headers.get("cookie") || undefined);
    const allowShadowTracks = Boolean(flags.betaUnlock);

    const items: SearchItem[] = [];
    const pushUnique = (candidate: SearchItem) => {
      const key = `${candidate.type}:${candidate.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push(candidate);
    };
    const seen = new Set<string>();

    async function safeQuery<T>(fn: () => Promise<T[]>, map: (row: any) => SearchItem | null) {
      try {
        const rows = await fn();
        for (const row of rows) {
          if (items.length >= MAX_TOTAL_RESULTS) return;
          const mapped = map(row);
          if (mapped) {
            pushUnique(mapped);
          }
        }
      } catch (error) {
        console.error("Search query failed:", error);
      }
    }

    await safeQuery(
      () =>
        prisma.track.findMany({
          where: { title: { contains: q, mode: "insensitive" } },
          include: { artist: true },
          take: MAX_RESULTS_PER_SECTION,
        }),
      (r) => ({
        type: "Tracks",
        id: r.id,
        title: r.title,
        href: `/track/${r.id}`,
        audio_url: r.audio_url,
        artist: r.artist?.stageName || "Unknown Artist",
        thumbnail: r.cover_url ?? undefined,
      })
    );

    await safeQuery(
      () =>
        prisma.artist.findMany({
          where: { stageName: { contains: q, mode: "insensitive" } },
          take: MAX_RESULTS_PER_SECTION,
        }),
      (r) => ({
        type: "Artists",
        id: r.id,
        title: r.stageName,
        href: `/artist/${r.id}`,
        thumbnail: r.avatar_url ?? undefined,
      })
    );

    await safeQuery(
      () =>
        prisma.album.findMany({
          where: { title: { contains: q, mode: "insensitive" } },
          include: { artist: true },
          take: MAX_RESULTS_PER_SECTION,
        }),
      (r) => ({
        type: "Albums",
        id: r.id,
        title: r.title,
        href: `/album/${r.id}`,
        artist: r.artist?.stageName || "Unknown Artist",
        thumbnail: r.cover_url ?? undefined,
      })
    );

    await safeQuery(
      () =>
        prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          take: MAX_RESULTS_PER_SECTION,
        }),
      (r) => ({
        type: "Users",
        id: r.id,
        title: r.username ?? r.email ?? "user",
        href: `/user/${r.id}`,
        thumbnail: r.avatar_url ?? undefined,
      })
    );

    await safeQuery(
      () =>
        prisma.product.findMany({
          where: { title: { contains: q, mode: "insensitive" } },
          take: MAX_RESULTS_PER_SECTION,
        }),
      (r) => ({
        type: "Products",
        id: r.id,
        title: r.title,
        href: `/product/${r.id}`,
        thumbnail: r.image_url ?? undefined,
      })
    );

    if (requestYoutube && allowShadowTracks && items.length < MAX_TOTAL_RESULTS) {
      try {
        const ytData = await ytFetch<any>("search", {
          part: "snippet",
          type: "video",
          maxResults: Math.min(5, MAX_TOTAL_RESULTS - items.length),
          q,
        });

        for (const raw of ytData.items || []) {
          if (items.length >= MAX_TOTAL_RESULTS) break;
          const id = raw?.id?.videoId ?? raw?.id;
          const snippet = raw?.snippet;
          if (!id || !snippet) continue;

          pushUnique({
            type: "YouTube",
            id: `yt_${id}`,
            title: snippet.title,
            href: `/surf?v=${id}`,
            artist: snippet.channelTitle,
            thumbnail:
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              snippet.thumbnails?.default?.url,
            isYoutube: true,
            actions: allowShadowTracks ? ["shadowTrack"] : [],
          });
        }
      } catch (error) {
        console.error("YouTube search error:", error);
      }
    }

    return NextResponse.json({
      items,
      meta: {
        allowShadowTracks,
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ items: [], meta: { allowShadowTracks: false } });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const COVER_FALLBACK = "/branding/cropped_tap_logo.png";

function normalizeTrack(track: any) {
  const fallbackArtistCover =
    track.artist?.links && typeof track.artist.links === "object" ? track.artist.links.image ?? undefined : undefined;
  return {
    id: track.id,
    title: track.title ?? "Untitled",
    artist: track.artist?.stageName ?? track.artist?.name ?? "Unknown",
    album: track.album?.title ?? "Single",
    duration: Math.round((track.durationMs ?? 0) / 1000),
    cover: track.album?.coverUrl ?? fallbackArtistCover ?? COVER_FALLBACK,
    explicit: track.meta?.explicit ?? false,
    liked: Boolean(track.stats?.likeCount),
  };
}

function normalizePlaylist(pl: any) {
  return {
    id: pl.id,
    title: pl.title,
    cover: pl.coverUrl ?? COVER_FALLBACK,
    tracks: pl._count?.tracks ?? 0,
    updatedAt: pl.updatedAt?.toISOString() ?? new Date().toISOString(),
    description: pl.title,
  };
}

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [library, playlists, trades, tapPass, albums, artists, posters, recommendations] = await Promise.all([
      prisma.library.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              track: {
                include: {
                  artist: true,
                  album: true,
                  stats: true,
                },
              },
            },
          },
        },
      }),
      prisma.playlist.findMany({
        where: { userId },
        take: 14,
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { tracks: true } } },
      }),
      prisma.trade.findMany({
        where: { OR: [{ initiatorId: userId }, { receiverId: userId }] },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.tapPass.findFirst({ where: { userId }, orderBy: { expiresAt: "desc" } }),
      prisma.album.findMany({
        take: 12,
        orderBy: { releaseAt: "desc" },
        include: { artist: true },
      }),
      prisma.artist.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
      prisma.product.findMany({
        take: 12,
        where: { desc: { contains: "poster", mode: "insensitive" } },
      }),
      prisma.track.findMany({
        take: 12,
        orderBy: { updatedAt: "desc" },
        include: { artist: true, album: true },
      }),
    ]);

    const libraryTracks = (library?.items ?? []).map((item) => normalizeTrack(item.track));
    const playlistData = playlists.map(normalizePlaylist);
    const tradeData = trades.map((t) => {
      let parsed: any = t.items;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = {};
        }
      }
      return {
        id: t.id,
        type: parsed?.type ?? "trade",
        status: t.status,
        unit: parsed?.label ?? "TAP",
        qty: parsed?.qty ?? 1,
        price: (parsed?.amount ?? 0) / 100,
        ts: t.createdAt.toISOString(),
      };
    });

    const albumData = albums.map((al: any) => ({
      id: al.id,
      title: al.title,
      artist: al.artist?.stageName ?? "Unknown",
      year: al.releaseAt ? new Date(al.releaseAt).getFullYear() : new Date().getFullYear(),
      cover: al.coverUrl ?? COVER_FALLBACK,
      tracks: al.tracks?.length ?? 0,
    }));

    const artistData = await Promise.all(
      artists.map(async (artist) => {
        const followers = await prisma.follow.count({ where: { followingId: artist.userId } });
        return {
          id: artist.id,
          name: artist.stageName,
          cover: artist.user?.avatarUrl ?? COVER_FALLBACK,
          followers,
        };
      })
    );

    const posterData = posters.map((p) => {
      const rawImages = Array.isArray(p.images) ? p.images : typeof p.images === "string" ? JSON.parse(p.images || "[]") : [];
      const image = rawImages[0] ?? COVER_FALLBACK;
      return {
        id: p.id,
        title: p.title,
        edition: `1/${Math.max(1, p.inventory || 1)}`,
        image,
        tx: p.desc ?? "posterized",
        createdAt: p.createdAt.toISOString(),
      };
    });
    const libraryIds = new Set(libraryTracks.map((t) => t.id));
    const recommendationData = recommendations
      .filter((t) => !libraryIds.has(t.id))
      .slice(0, 6)
      .map((track) => normalizeTrack(track));

    return NextResponse.json({
      tracks: libraryTracks,
      playlists: playlistData,
      trades: tradeData,
      albums: albumData,
      artists: artistData,
      posters: posterData,
      pass: tapPass
        ? {
            feature: tapPass.feature,
            expiresAt: tapPass.expiresAt?.toISOString(),
          }
        : null,
      recommendations: recommendationData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to load library" }, { status: 500 });
  }
}

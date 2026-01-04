import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const COVER_FALLBACK = "/branding/cropped_tap_logo.png";

function buildTrackPayload(track: any) {
  return {
    id: track.id,
    title: track.title ?? "Untitled",
    artist: track.artist?.stageName ?? "Unknown",
    album: track.album?.title ?? "Single",
    duration: Math.round((track.durationMs ?? 0) / 1000),
    cover: track.album?.coverUrl ?? track.artist?.links?.image ?? COVER_FALLBACK,
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as any)?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = {
      trackId: body.trackId as string | undefined,
      title: (body.title as string | undefined)?.slice(0, 120),
      duration: Number(body.duration || 0),
      cover: body.cover as string | undefined,
      source: body.source as string | undefined,
    };

    let track = null;
    if (payload.trackId) {
      track = await prisma.track.findUnique({
        where: { id: payload.trackId },
        include: { artist: true, album: true },
      });
    }

    if (!track) {
      const artist = (await prisma.artist.findFirst({ where: { userId } })) || (await prisma.artist.create({
        data: {
          userId,
          stageName: `Creator ${userId.slice(0, 6)}`,
        },
      }));

      track = await prisma.track.create({
        data: {
          title: payload.title ?? "Untitled Track",
          artistId: artist.id,
          durationMs: payload.duration ? Math.floor(payload.duration * 1000) : undefined,
          visibility: "UNLISTED",
          meta: { source: payload.source ?? "local" },
        },
        include: { artist: true, album: true },
      });
    }

    const library = await prisma.library.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await prisma.libraryItem.upsert({
      where: { libraryId_trackId: { libraryId: library.id, trackId: track.id } },
      update: {},
      create: { libraryId: library.id, trackId: track.id },
    });

    return NextResponse.json({ ok: true, track: buildTrackPayload(track) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to save track" }, { status: 500 });
  }
}

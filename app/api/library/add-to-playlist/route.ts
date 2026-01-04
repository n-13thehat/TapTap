import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as any)?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const trackId = body.trackId as string | undefined;
    const playlistId = body.playlistId as string | undefined;
    const title = ((body.title as string | undefined) ?? "Favorites").slice(0, 64);
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });

    let playlist = playlistId
      ? await prisma.playlist.findFirst({ where: { id: playlistId, userId } })
      : null;

    if (!playlist) {
      playlist = await prisma.playlist.create({
        data: {
          userId,
          title,
          visibility: "PRIVATE",
        },
      });
    }

    try {
      await prisma.playlistTrack.create({
        data: {
          playlistId: playlist.id,
          trackId,
          addedById: userId,
        },
      });
    } catch (error) {
      // ignore duplicates
    }

    return NextResponse.json({
      ok: true,
      playlist: {
        id: playlist.id,
        title: playlist.title,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to add to playlist" }, { status: 500 });
  }
}

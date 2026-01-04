import { NextRequest, NextResponse } from "next/server";
import { getSurfStore, generateId, persistStore } from "@/lib/server/memoryStore";
import { dbAddSurfPlaylistItem } from "@/lib/server/persistence";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const playlistId = resolvedParams?.id;
  const body = await req.json().catch(() => null) as {
    videoId?: string;
    title?: string;
    channelTitle?: string;
    thumbnail?: string;
    publishedAt?: string;
  } | null;

  if (!playlistId || !body?.videoId || !body?.title) {
    return NextResponse.json({ error: "playlist id, videoId, and title are required" }, { status: 400 });
  }

  try {
    const item = await dbAddSurfPlaylistItem(playlistId, {
      videoId: body.videoId,
      title: body.title,
      channelTitle: body.channelTitle ?? null,
      thumbnail: body.thumbnail ?? null,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[surf] DB add playlist item failed, falling back to memory", err);
    const store = getSurfStore();
    const playlist = store.playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const item = {
      id: generateId("surf-item"),
      videoId: body.videoId,
      title: body.title,
      channelTitle: body.channelTitle,
      thumbnail: body.thumbnail,
      publishedAt: body.publishedAt,
      addedAt: new Date().toISOString(),
    };

    playlist.items = [item, ...playlist.items.filter((i) => i.videoId !== item.videoId)].slice(0, 100);

    await persistStore();

    return NextResponse.json({ item }, { status: 201 });
  }
}

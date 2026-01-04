import { NextRequest, NextResponse } from "next/server";
import { getSurfStore, generateId, persistStore } from "@/lib/server/memoryStore";
import { dbCreateSurfPlaylist, dbListSurfPlaylists } from "@/lib/server/persistence";

export async function GET() {
  try {
    const playlists = await dbListSurfPlaylists();
    return NextResponse.json({ items: playlists }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[surf] DB list playlists failed, falling back to memory", err);
    const store = getSurfStore();
    return NextResponse.json({ items: store.playlists }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { title?: string } | null;
  const title = (body?.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const playlist = await dbCreateSurfPlaylist(title);
    return NextResponse.json({ playlist }, { status: 201 });
  } catch (err) {
    console.error("[surf] DB create playlist failed, falling back to memory", err);
    const store = getSurfStore();
    const playlist = {
      id: generateId("surf-pl"),
      title,
      createdAt: new Date().toISOString(),
      items: [],
    };
    store.playlists = [playlist, ...store.playlists].slice(0, 25);
    await persistStore();
    return NextResponse.json({ playlist }, { status: 201 });
  }
}

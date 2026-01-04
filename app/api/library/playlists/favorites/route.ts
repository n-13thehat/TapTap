import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const meId = (session as any)?.user?.id as string | undefined;
    if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { trackId } = await req.json();
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });
    const title = 'Favorites';
      let playlist = await prisma.playlist.findFirst({ where: { userId: meId, title }, select: { id: true } });
      if (!playlist) {
        const created = await prisma.playlist.create({ data: { userId: meId, title } });
        playlist = { id: created.id };
      }
      const playlistId = playlist.id;
      await prisma.playlistTrack.upsert({
        where: { playlistId_trackId: { playlistId, trackId } },
        update: {},
        create: { playlistId, trackId, addedById: meId },
      });
      return NextResponse.json({ ok: true, id: playlistId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

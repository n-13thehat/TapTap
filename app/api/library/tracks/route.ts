import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const meId = (session as any)?.user?.id as string | undefined;
    if (!meId) return NextResponse.json({ items: [] });
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const providerFilter = (searchParams.get("provider") || "").trim().toLowerCase() || null;
    const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") || 200)));
    const items = await prisma.libraryItem.findMany({
      where: { library: { userId: meId } },
      orderBy: { createdAt: "desc" },
      include: { track: { include: { artist: true, album: true } } },
      take: limit,
    });
    const mapped = items.map((it) => ({
      id: it.trackId,
      title: it.track.title,
      artist: it.track.artist?.stageName || "",
      album: it.track.album?.title || "",
      duration: Math.round((it.track.durationMs || 0) / 1000),
      cover: it.track.album?.coverUrl || "",
      liked: true,
    }));
    const external = await prisma.externalLibraryItem.findMany({
      where: { userId: meId, ...(providerFilter ? { provider: providerFilter } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const externalMapped = external.map((it) => ({
      id: `${it.provider}:${it.externalId}`,
      title: it.title,
      artist: it.artist,
      album: it.album || "",
      duration: Math.round(((it as any)?.durationMs || 0) / 1000) || 0,
      cover: it.coverUrl || "",
      liked: true,
      audioUrl: it.audioUrl || null,
      provider: it.provider,
      deezerUrl: it.deezerUrl || null,
    }));
    const all = [...externalMapped, ...mapped];
    const filtered = q ? all.filter((t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q)) : all;
    return NextResponse.json({ items: filtered });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const meId = (session as any)?.user?.id as string | undefined;
    if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const action = String(body?.action || "");
    const trackId = String(body?.trackId || "").trim();
    const provider = String(body?.provider || "").trim();
    const externalId = String(body?.externalId || "").trim();
    const isExternal = !!provider && !!externalId && !trackId;
    if (!trackId && !externalId) return NextResponse.json({ error: "trackId or externalId required" }, { status: 400 });
    if (isExternal && !provider) return NextResponse.json({ error: "provider required for external save" }, { status: 400 });
    const lib = await prisma.library.upsert({ where: { userId: meId }, update: {}, create: { userId: meId } });
    if (action === "save") {
      if (trackId && !isExternal) {
        await prisma.libraryItem.upsert({
          where: { libraryId_trackId: { libraryId: lib.id, trackId } },
          update: {},
          create: { libraryId: lib.id, trackId },
        });
        return NextResponse.json({ ok: true });
      }
      if (isExternal) {
        const title = String(body?.title || "").trim();
        const artist = String(body?.artist || "").trim();
        if (!title || !artist) return NextResponse.json({ error: "title and artist required for external save" }, { status: 400 });
        const album = body?.album ? String(body.album) : null;
        const coverUrl = body?.coverUrl ? String(body.coverUrl) : null;
        const audioUrl = body?.audioUrl ? String(body.audioUrl) : null;
        const deezerUrl = body?.deezerUrl ? String(body.deezerUrl) : null;
        await prisma.externalLibraryItem.upsert({
          where: { userId_provider_externalId: { userId: meId, provider, externalId } },
          update: { title, artist, album: album || undefined, coverUrl: coverUrl || undefined, audioUrl: audioUrl || undefined, deezerUrl: deezerUrl || undefined },
          create: { userId: meId, provider, externalId, title, artist, album: album || undefined, coverUrl: coverUrl || undefined, audioUrl: audioUrl || undefined, deezerUrl: deezerUrl || undefined },
        });
        return NextResponse.json({ ok: true, external: true });
      }
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    if (action === "unsave") {
      if (trackId) {
        const existing = await prisma.libraryItem.findFirst({ where: { libraryId: lib.id, trackId }, select: { id: true } });
        if (existing) await prisma.libraryItem.delete({ where: { id: existing.id } });
      }
      if (isExternal) {
        const existingExternal = await prisma.externalLibraryItem.findFirst({
          where: { userId: meId, provider, externalId },
          select: { id: true },
        });
        if (existingExternal) await prisma.externalLibraryItem.delete({ where: { id: existingExternal.id } });
      }
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e: any) {
    console.error("library/tracks POST failed", e);
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

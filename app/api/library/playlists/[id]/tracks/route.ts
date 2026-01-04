import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

export const dynamic = "force-dynamic";

type IdContext = { params: Promise<{ id: string }> };

async function resolvePlaylistId(context: IdContext) {
  const { id } = await context.params;
  return id;
}

export async function POST(req: NextRequest, context: IdContext) {
  try {
    const session = await auth();
    const meId = (session as any)?.user?.id as string | undefined;
    if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const playlistId = await resolvePlaylistId(context);
    const body = await req.json();
    const trackId = String(body?.trackId || "").trim();
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });
    // Verify ownership
    const pl = await prisma.playlist.findFirst({ where: { id: playlistId, userId: meId }, select: { id: true } });
    if (!pl) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.playlistTrack.upsert({ where: { playlistId_trackId: { playlistId, trackId } }, update: {}, create: { playlistId, trackId, addedById: meId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: IdContext) {
  try {
    const session = await auth();
    const meId = (session as any)?.user?.id as string | undefined;
    if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const playlistId = await resolvePlaylistId(context);
    const { searchParams } = new URL(req.url);
    const trackId = String(searchParams.get('trackId') || '').trim();
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });
    const pl = await prisma.playlist.findFirst({ where: { id: playlistId, userId: meId }, select: { id: true } });
    if (!pl) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const existing = await prisma.playlistTrack.findFirst({ where: { playlistId, trackId }, select: { id: true } });
    if (existing) await prisma.playlistTrack.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const items = await prisma.album.findMany({
      where: q ? { title: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: { id: true, title: true, coverUrl: true, tracks: { select: { id: true } }, artist: { select: { stageName: true } }, updatedAt: true },
    });
    return NextResponse.json({ items: items.map((a)=>({ id: a.id, title: a.title, artist: a.artist?.stageName || '', year: new Date(a.updatedAt).getFullYear(), cover: a.coverUrl || '', tracks: a.tracks.length })) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


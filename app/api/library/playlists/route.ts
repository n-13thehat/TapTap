import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const meId = (session as any)?.user?.id as string | undefined;
    if (!meId) return NextResponse.json({ items: [] });
    const items = await prisma.playlist.findMany({ where: { userId: meId }, orderBy: { updatedAt: "desc" }, take: 100 });
    return NextResponse.json({ items: items.map((p) => ({ id: p.id, title: p.title, updatedAt: p.updatedAt })) });
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
    const title = String(body?.title || "").trim() || "New Playlist";
    const created = await prisma.playlist.create({ data: { userId: meId, title } });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


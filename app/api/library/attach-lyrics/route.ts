import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as any)?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { trackId, lyrics } = await req.json();
    if (!trackId || typeof lyrics !== "string") {
      return NextResponse.json({ error: "trackId and lyrics required" }, { status: 400 });
    }

    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const meta = typeof track.meta === "object" ? { ...track.meta, lyrics } : { lyrics };
    await prisma.track.update({ where: { id: trackId }, data: { meta } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to attach lyrics" }, { status: 500 });
  }
}

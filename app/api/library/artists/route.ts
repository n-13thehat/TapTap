import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const items = await prisma.artist.findMany({
      where: q ? { stageName: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: { id: true, stageName: true },
    });
    // No images in schema; leave cover empty
    return NextResponse.json({ items: items.map((a)=>({ id: a.id, name: a.stageName, cover: '', followers: 0 })) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


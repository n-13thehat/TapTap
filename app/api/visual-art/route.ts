import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pieces = await prisma.visualArtPiece.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ pieces });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const title = String(body?.title || "").trim();
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

    let chipId: string | null = null;
    if (body?.ttid) {
      const chip = await prisma.encodedChip.findUnique({
        where: { ttid: String(body.ttid) },
        select: { id: true, status: true, visualArt: { select: { id: true } } },
      });
      if (!chip) return NextResponse.json({ error: "ttid not found" }, { status: 404 });
      if (chip.visualArt) {
        return NextResponse.json({ error: "ttid already bound to art" }, { status: 409 });
      }
      chipId = chip.id;
    }

    const piece = await prisma.visualArtPiece.create({
      data: {
        creatorId: user.id,
        chipId,
        title,
        description: body?.description ?? null,
        process: body?.process ?? null,
        story: body?.story ?? null,
        meaning: body?.meaning ?? null,
        imageUrl: body?.imageUrl ?? null,
        videoUrl: body?.videoUrl ?? null,
      },
    });

    if (chipId) {
      await prisma.encodedChip.update({
        where: { id: chipId },
        data: { payloadType: "VISUAL_ART" as any, payloadId: piece.id },
      });
    }

    return NextResponse.json({ piece });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ttid: string }> }
) {
  const { ttid } = await params;
  if (!ttid) return NextResponse.json({ error: "ttid required" }, { status: 400 });
  const chip = await prisma.encodedChip.findUnique({
    where: { ttid },
    select: { id: true, status: true, visualArt: true },
  });
  if (!chip || !chip.visualArt) {
    return NextResponse.json({ error: "no art bound to this chip" }, { status: 404 });
  }
  return NextResponse.json({ piece: chip.visualArt, chipStatus: chip.status });
}

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
    select: {
      ttid: true,
      status: true,
      payloadType: true,
      payloadId: true,
      activatedAt: true,
      createdAt: true,
      _count: { select: { activations: true } },
    },
  });
  if (!chip) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ chip });
}

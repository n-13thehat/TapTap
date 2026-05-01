import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user || (user.role as any) !== "ADMIN") return null;
  return user;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const ttid = String(body?.ttid || "");
    const uid = String(body?.uid || "").trim();
    if (!ttid || !uid) {
      return NextResponse.json({ error: "ttid and uid required" }, { status: 400 });
    }

    const chip = await prisma.encodedChip.findUnique({
      where: { ttid },
      select: { id: true, status: true, uid: true },
    });
    if (!chip) return NextResponse.json({ error: "ttid not found" }, { status: 404 });
    if (chip.uid && chip.uid !== uid) {
      return NextResponse.json(
        { error: "ttid already bound to a different uid" },
        { status: 409 }
      );
    }

    const updated = await prisma.encodedChip.update({
      where: { id: chip.id },
      data: {
        uid,
        status: "ENCODED" as any,
        encodedAt: chip.status === "UNENCODED" ? new Date() : undefined,
        payloadType: body?.payloadType ?? undefined,
        payloadId: body?.payloadId ?? undefined,
        creatorId: body?.creatorId ?? undefined,
      },
    });
    return NextResponse.json({ chip: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bind failed" }, { status: 500 });
  }
}

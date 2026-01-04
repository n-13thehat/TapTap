import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = (searchParams.get("chatId") || "").trim();
    if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });
    const items = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      select: { id: true, text: true, createdAt: true, senderId: true },
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


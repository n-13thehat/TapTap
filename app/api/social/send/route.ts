import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const meId = (session as any)?.user?.id as string | undefined;
    if (!meId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const chatId = String(body?.conversationId || body?.chatId || "").trim();
    const text = String(body?.text || "").trim();
    const clientRequestId = body?.clientRequestId
      ? String(body.clientRequestId)
      : undefined;

    if (!chatId || !text) {
      return NextResponse.json(
        { error: "conversationId/chatId and text are required" },
        { status: 400 }
      );
    }

    // TODO: Add clientRequestId field to Message schema
    // if (clientRequestId) {
    //   const existing = await prisma.message.findUnique({
    //     where: { clientRequestId },
    //   });
    //   if (existing) {
    //     return NextResponse.json({ ok: true, duplicate: true, messageId: existing.id });
    //   }
    // }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: meId,
        text,
        // TODO: Add clientRequestId field to Message schema
        // clientRequestId,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true, messageId: message.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

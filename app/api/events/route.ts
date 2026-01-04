import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type, payload, targetId } = body || {};
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "type required" }, { status: 400 });
    }
    const session = await auth();
    const userId = (session as any)?.user?.id ?? null;

    await prisma.metricEvent
      .create({
        data: {
          userId,
          type,
          targetId: targetId ?? null,
          meta: payload ?? null,
        },
      })
      .catch(() => {});

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

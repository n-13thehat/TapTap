import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session as any)?.user?.id;
    if (!userId) return NextResponse.json([]);

    const rows = await prisma.notification
      .findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
      .catch(() => [] as any[]);

    const items = rows.map((n: any) => {
      let payload: any = {};

      // Parse payload if it's a string
      if (typeof n.payload === 'string') {
        try {
          payload = JSON.parse(n.payload);
        } catch {
          payload = { message: n.payload };
        }
      } else if (n.payload && typeof n.payload === 'object') {
        payload = n.payload;
      }

      return {
        id: n.id,
        title: payload.title || String(n.type ?? "Notification"),
        message: payload.message || "",
        read: !!n.readAt,
        agentId: payload.agentId,
        priority: payload.priority || 'low',
        actions: payload.actions || [],
        metadata: payload.metadata || {},
        createdAt: n.createdAt,
      };
    });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}

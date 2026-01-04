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

    const items = rows.map((n: any) => ({
      id: n.id,
      title: String(n.type ?? "Notification"),
      message:
        n.payload && typeof n.payload === "object" && "message" in n.payload
          ? (n.payload as any).message
          : "",
      read: !!n.readAt,
    }));

    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}

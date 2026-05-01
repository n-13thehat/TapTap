import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { recordActivation } from "@/lib/encoder";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ttid = String(body?.ttid || "");
    if (!ttid) return NextResponse.json({ error: "ttid required" }, { status: 400 });

    let userId: string | null = null;
    try {
      const session = await auth();
      const email = (session as any)?.user?.email as string | undefined;
      if (email) {
        const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        userId = u?.id ?? null;
      }
    } catch {
      userId = null;
    }

    const fwd = req.headers.get("x-forwarded-for") || "";
    const ip = fwd.split(",")[0]?.trim() || null;
    const countryCode = req.headers.get("x-vercel-ip-country") || null;

    const result = await recordActivation({
      ttid,
      uid: body?.uid ?? null,
      ip,
      countryCode,
      userId,
    });

    if (!result.ok && !result.fraudSignals.length) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Activate failed" }, { status: 500 });
  }
}

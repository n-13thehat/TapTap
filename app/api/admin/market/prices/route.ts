import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return false;
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return (user as any)?.role === "ADMIN";
}

async function readSetting(key: string) {
  try {
    const s = await prisma.setting.findUnique({ where: { userId_key: { userId: "market", key } } });
    return (s?.value as any) || null;
  } catch {
    return null;
  }
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [sol, tap] = await Promise.all([readSetting("market:sol:usd"), readSetting("market:tap:usd")]);
  return NextResponse.json({
    sol: {
      usd: typeof sol?.usd === "number" ? sol.usd : null,
      source: sol?.source || (sol?.fetchedAt ? "coingecko" : null),
      fetchedAt: sol?.fetchedAt || null,
    },
    tap: {
      usd: typeof tap?.usd === "number" ? tap.usd : null,
      source: "manual",
      fetchedAt: tap?.fetchedAt || null,
    },
    pair: {
      tapPerSol:
        typeof sol?.usd === "number" && typeof tap?.usd === "number" && tap.usd > 0
          ? sol.usd / tap.usd
          : null,
      solPerTap:
        typeof sol?.usd === "number" && typeof tap?.usd === "number" && sol.usd > 0
          ? tap.usd / sol.usd
          : null,
    },
  });
}

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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const skus = await prisma.hardwareSku.findMany({
    orderBy: [{ active: "desc" }, { code: "asc" }],
  });
  return NextResponse.json({ skus });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const code = String(body?.code || "").trim().toUpperCase();
    const name = String(body?.name || "").trim();
    if (!code || !name) {
      return NextResponse.json({ error: "code and name required" }, { status: 400 });
    }
    const sku = await prisma.hardwareSku.create({
      data: {
        code,
        name,
        chipType: (body?.chipType || "NTAG215") as any,
        formFactor: (body?.formFactor || "KEYCHAIN") as any,
        unitCostCents: Number(body?.unitCostCents || 0),
        retailCents: Number(body?.retailCents || 0),
        active: body?.active !== false,
      },
    });
    return NextResponse.json({ sku });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}

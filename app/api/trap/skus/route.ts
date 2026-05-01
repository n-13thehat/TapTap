import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const skus = await prisma.hardwareSku.findMany({
    where: { active: true },
    orderBy: { retailCents: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      chipType: true,
      formFactor: true,
      retailCents: true,
    },
  });
  return NextResponse.json({ skus });
}

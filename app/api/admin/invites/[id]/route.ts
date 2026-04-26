import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const invite = await prisma.betaInvite.findUnique({
    where: { id },
    select: { id: true, claimedByUserId: true },
  });
  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }
  if (invite.claimedByUserId) {
    return NextResponse.json(
      { error: "Cannot revoke an invite that has already been claimed." },
      { status: 409 }
    );
  }
  await prisma.betaInvite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

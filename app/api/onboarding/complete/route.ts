import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { notifyAgentEvent } from "@/lib/agents/notify";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { onboardingComplete: true, onboardedAt: new Date() },
    select: { id: true, onboardingComplete: true, onboardedAt: true },
  });

  // Fire welcome DM via Hope persona; non-blocking.
  notifyAgentEvent({ userId, eventType: "user.onboarded", data: {} });

  return NextResponse.json({ ok: true, user });
}

import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { greetingForNow, moodOfDay, moodTagline } from "@/app/lib/astrotech";

export async function GET() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, profile: { select: { displayName: true } } },
    });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const displayName = user.profile?.displayName || user.username || email.split("@")[0];
    const mood = moodOfDay(user.id);
    const greeting = greetingForNow(displayName);
    return Response.json({ id: user.id, username: user.username, displayName, mood, greeting, tagline: moodTagline(mood) });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}


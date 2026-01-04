import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ALBUM_BUCKET } from "@/lib/defaultAlbumConfig";

async function isAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return false;
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return user?.role === ("ADMIN" as any);
}

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const bucket = DEFAULT_ALBUM_BUCKET;
  const [waveformsPending, audioPending] = await Promise.all([
    prisma.track.count({ where: { waveformId: null, storageKey: { startsWith: `${bucket}/` } } }),
    prisma.track.count({ where: { durationMs: null, storageKey: { not: null } } }),
  ]);
  return Response.json({ waveformsPending, audioPending });
}




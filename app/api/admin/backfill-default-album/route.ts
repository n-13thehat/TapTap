import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { addDefaultAlbumToLibrary } from "@/lib/addDefaultAlbumToLibrary";

async function isAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return false;
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return user?.role === ("ADMIN" as any);
}

export async function POST() {
  if (!(await isAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  const albumTitle = "Music For The Future - Vx9";
  const system = await prisma.artist.findFirst({ where: { stageName: "VX9" }, select: { id: true } });
  const album = system
    ? await prisma.album.findFirst({ where: { title: albumTitle, artistId: system.id } })
    : null;

  const users = await prisma.user.findMany({ select: { id: true } });
  let processed = 0;
  let skipped = 0;
  const errors: Array<{ userId: string; error: string }> = [];

  for (const u of users) {
    try {
      if (album) {
        const has = await prisma.libraryItem.findFirst({
          where: { library: { userId: u.id }, track: { albumId: album.id } },
          select: { id: true },
        });
        if (has) {
          skipped++;
          continue;
        }
      }
      await addDefaultAlbumToLibrary(u.id);
      processed++;
    } catch (e: any) {
      errors.push({ userId: u.id, error: e?.message || String(e) });
    }
  }

  return Response.json({ ok: true, processed, skipped, errorsCount: errors.length, errors });
}




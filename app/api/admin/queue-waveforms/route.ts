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

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!base) return Response.json({ error: "Missing SUPABASE URL" }, { status: 500 });

  const webhook = process.env.AUDIO_WAVEFORM_WEBHOOK_URL || "";
  const limit = Number(new URL(req.url).searchParams.get("limit") || 20);
  const bucket = DEFAULT_ALBUM_BUCKET;

  const tracks = await prisma.track.findMany({
    where: { waveformId: null, storageKey: { startsWith: `${bucket}/` } },
    select: { id: true, storageKey: true },
    take: Math.min(200, Math.max(1, limit)),
  });

  const queued: any[] = [];
  const errors: any[] = [];
  for (const t of tracks) {
    try {
      const url = `${base}/storage/v1/object/public/${encodeURI(t.storageKey!)}`;
      if (webhook) {
        await fetch(webhook, {
          method: "POST",
          headers: { "content-type": "application/json", "x-signature": process.env.AUDIO_WAVEFORM_SECRET || "" },
          body: JSON.stringify({ trackId: t.id, url }),
        });
      }
      try {
        await prisma.setting.upsert({
          where: { userId_key: { userId: t.id, key: `waveform:task:${t.id}` } },
          update: { value: { status: webhook ? "queued" : "listed", attempts: (new Date()).toISOString() } as any },
          create: { userId: t.id, key: `waveform:task:${t.id}`, value: { status: webhook ? "queued" : "listed", attempts: 0 } as any },
        });
      } catch {}
      queued.push({ id: t.id, url });
    } catch (e: any) {
      errors.push({ id: t.id, error: e?.message || String(e) });
    }
  }

  return Response.json({ ok: true, queued, errorsCount: errors.length, errors, mode: webhook ? "webhook" : "listing" });
}



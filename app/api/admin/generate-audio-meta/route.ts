import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ALBUM_BUCKET } from "@/lib/defaultAlbumConfig";
import * as mm from "music-metadata";

async function isAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return false;
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return user?.role === ("ADMIN" as any);
}

export async function POST() {
  if (!(await isAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  const bucket = DEFAULT_ALBUM_BUCKET;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!base) return Response.json({ error: "Missing SUPABASE URL" }, { status: 500 });

  const tracks = await prisma.track.findMany({
    where: {
      OR: [{ durationMs: null }, { waveformId: null }],
      storageKey: { startsWith: `${bucket}/` },
    },
    select: { id: true, storageKey: true, durationMs: true, waveformId: true },
  });

  let updated = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const t of tracks) {
    try {
      const publicUrl = `${base}/storage/v1/object/public/${encodeURI(t.storageKey!)}`;
      const res = await fetch(publicUrl);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await mm.parseBuffer(buf, "audio/mpeg");
      const durMs = Math.round((meta.format.duration || 0) * 1000);

      let waveformId = t.waveformId;
      if (!waveformId) {
        const wf = await prisma.waveform.create({ data: { points: Array(64).fill(0.5) as any } });
        waveformId = wf.id;
      }

      await prisma.track.update({ where: { id: t.id }, data: { durationMs: durMs || t.durationMs, waveformId } });
      updated++;
    } catch (e: any) {
      errors.push({ id: t.id, error: e?.message || String(e) });
    }
  }

  return Response.json({ ok: true, total: tracks.length, updated, errorsCount: errors.length, errors });
}




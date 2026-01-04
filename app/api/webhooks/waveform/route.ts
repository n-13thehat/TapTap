import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const secret = process.env.AUDIO_WAVEFORM_SECRET || "";
  const sig = req.headers.get("x-signature") || "";
  if (!secret || sig !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { trackId, points, durationMs } = await req.json();
    if (!trackId || !Array.isArray(points) || points.length === 0) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }
    const wf = await prisma.waveform.create({ data: { points } });
    await prisma.track.update({ where: { id: trackId }, data: { waveformId: wf.id, ...(durationMs ? { durationMs } : {}) } });
    try {
      await prisma.setting.upsert({
        where: { userId_key: { userId: trackId, key: `waveform:task:${trackId}` } },
        update: { value: { status: "done", waveformId: wf.id, updatedAt: new Date().toISOString() } as any },
        create: { userId: trackId, key: `waveform:task:${trackId}`, value: { status: "done", waveformId: wf.id } as any },
      });
    } catch {}
    return Response.json({ ok: true, waveformId: wf.id });
  } catch (e: any) {
    return Response.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

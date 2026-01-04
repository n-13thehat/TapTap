export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const start = Number(body?.start ?? -1);
    const end = Number(body?.end ?? -1);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || start < 0) {
      return Response.json({ error: 'invalid range' }, { status: 400 });
    }
    const clipId = `clip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    // Stub: enqueue job for Posterize mint
    return Response.json({ ok: true, clipId });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}


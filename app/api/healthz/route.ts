import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  const checks: any = { ts: new Date().toISOString() };

  // DB check
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.db = { ok: true, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    checks.db = { ok: false, error: e?.message || String(e) };
  }

  // Supabase reachability
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!url) throw new Error('missing supabase url');
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    checks.supabase = { ok: true, status: res.status };
  } catch (e: any) {
    checks.supabase = { ok: false, error: e?.message || String(e) };
  }

  const ok = !!(checks.db?.ok && checks.supabase?.ok);
  const status = ok ? 200 : 503;
  checks.durationMs = Date.now() - started;
  return Response.json({ ok, ...checks }, { status });
}


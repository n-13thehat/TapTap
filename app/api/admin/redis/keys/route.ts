import { auth } from "@/auth.config";
import { Redis } from "@upstash/redis";

async function isAdmin() {
  try {
    const session = await auth();
    const role = (session as any)?.user?.role;
    return role === "ADMIN";
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return Response.json({ error: "Upstash not configured" }, { status: 400 });
  const redis = new Redis({ url, token });
  const u = new URL(req.url);
  const pattern = u.searchParams.get('pattern') || 'rate:*';
  const limit = Math.min(200, Math.max(1, parseInt(u.searchParams.get('limit') || '50', 10)));
  // Upstash supports KEYS but avoid heavy usage; this is a small inspect only
  let keys: string[] = [];
  try {
    // @ts-ignore
    keys = await (redis as any).keys(pattern);
  } catch (e) {
    return Response.json({ error: 'Unable to list keys', detail: String(e) }, { status: 500 });
  }
  const first = keys.slice(0, limit);
  const entries: any[] = [];
  for (const k of first) {
    try {
      const val = await redis.get(k);
      let ttl: number | null = null;
      try {
        // @ts-ignore
        ttl = await (redis as any).ttl(k);
      } catch { /* ignore ttl errors */ }
      entries.push({ key: k, ttl, value: val });
    } catch { /* ignore key errors */ }
  }
  return Response.json({ total: keys.length, previewCount: entries.length, entries });
}



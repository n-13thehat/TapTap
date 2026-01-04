import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return false;
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return user?.role === ("ADMIN" as any);
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Forbidden", { status: 403 });
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!base) return new Response("Missing SUPABASE URL", { status: 500 });
  const urlObj = new URL(req.url);
  const limit = Number(urlObj.searchParams.get("limit") || 100);
  const q = (urlObj.searchParams.get("q") || '').toLowerCase();
  const tracks = await prisma.track.findMany({
    where: { durationMs: null, storageKey: { not: null } },
    select: { id: true, storageKey: true },
    take: Math.min(10000, Math.max(1, limit)),
  });
  const filtered = q
    ? tracks.filter((t) => t.id.toLowerCase().includes(q) || (t.storageKey || '').toLowerCase().includes(q))
    : tracks;
  const rows = filtered.map((t) => `${t.id},${base}/storage/v1/object/public/${encodeURI(t.storageKey!)}`);
  const csv = ["id,url", ...rows].join("\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8" } });
}



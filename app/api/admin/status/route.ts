import { auth } from "@/auth.config";

async function isAdmin() {
  try {
    const session = await auth();
    const role = (session as any)?.user?.role;
    return role === "ADMIN";
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const upstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  return Response.json({ rateLimiter: upstash ? "upstash" : "memory" });
}




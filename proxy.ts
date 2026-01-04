import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateGateFromNextRequest } from "./app/api/_lib/rate";

const HEALTH_PATHS = ["/api/health", "/api/health/"];
const ADMIN_ONLY = ["/trap", "/admin", "/api/admin"];
const CREATOR_OR_ADMIN = ["/live/creator"];
const RATE_LIMITED_PUBLIC = [
  "/api/surf/search",
  "/api/surf/trending",
  "/api/surf/video",
  "/api/social/feed",
];

type Bucket = { tokens: number; lastRefill: number };
const globalAny: any = globalThis as any;
if (!globalAny.__rlBuckets) globalAny.__rlBuckets = new Map<string, Bucket>();
const buckets: Map<string, Bucket> = globalAny.__rlBuckets;

function isHealthPath(pathname: string) {
  return HEALTH_PATHS.includes(pathname);
}

function isTestRoute(pathname: string) {
  return (
    pathname === "/test" ||
    pathname.startsWith("/test-") ||
    pathname.startsWith("/test/") ||
    pathname.includes("/test-")
  );
}

function isBlueprintRoute(pathname: string) {
  return pathname.includes("/blueprint");
}

function isAdminRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function bucketKey(ip: string, path: string) {
  return `${ip}:${path}`;
}

function takeToken(ip: string, path: string, capacity = 30, refillPerSec = 0.5) {
  const key = bucketKey(ip, path);
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: capacity - 1, lastRefill: now };
    buckets.set(key, b);
    return true;
  }
  // Refill
  const elapsed = (now - b.lastRefill) / 1000;
  b.tokens = Math.min(capacity, b.tokens + elapsed * refillPerSec);
  b.lastRefill = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return true;
  }
  return false;
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname.toLowerCase();

  // Global kill switch via env for fast rollback
  const killSwitch =
    process.env.TAPTAP_KILL_SWITCH === "true" ||
    process.env.FEATURE_KILL_SWITCH === "true";
  if (killSwitch && !isHealthPath(pathname)) {
    return NextResponse.json(
      { error: "Service temporarily unavailable (kill switch active)." },
      { status: 503 }
    );
  }

  // Gate experimental/test routes unless explicitly allowed
  const allowExperiments = process.env.ALLOW_EXPERIMENT_ROUTES === "true";
  if (isTestRoute(pathname) && !allowExperiments) {
    return NextResponse.json({ error: "Route disabled" }, { status: 404 });
  }

  // Gate blueprint/spec routes unless explicitly allowed
  const allowBlueprints = process.env.ALLOW_BLUEPRINT_ROUTES === "true";
  if (isBlueprintRoute(pathname) && !allowBlueprints) {
    return NextResponse.json({ error: "Route disabled" }, { status: 404 });
  }

  // Admin route gating by environment flag (keeps prod safer by default)
  const adminRoutesAllowed =
    process.env.ALLOW_ADMIN_ROUTES === "true" ||
    process.env.NODE_ENV !== "production";
  if (isAdminRoute(pathname) && !adminRoutesAllowed) {
    return NextResponse.json({ error: "Admin routes disabled" }, { status: 403 });
  }

  const needsAdmin = ADMIN_ONLY.some((p) => pathname.startsWith(p));
  const needsCreator = CREATOR_OR_ADMIN.some((p) => pathname.startsWith(p));

  // Public rate limit for surf endpoints
  const rlTarget = RATE_LIMITED_PUBLIC.find((p) => pathname.startsWith(p));
  if (rlTarget) {
    const gate = await rateGateFromNextRequest(req, `mw:${rlTarget}`, { capacity: 30, refillPerSec: 0.5 });
    if (gate) return gate;
  }

  if (!needsAdmin && !needsCreator) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.redirect(new URL("/", req.url));
  const role = String((token as any).role || "LISTENER");

  if (needsAdmin && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (needsCreator && !(role === "CREATOR" || role === "ADMIN")) {
    return NextResponse.json({ error: "Creator access required" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|public/|uploads/).*)",
  ],
};

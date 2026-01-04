import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

type Bucket = { tokens: number; lastRefill: number };
type Options = { capacity?: number; refillPerSec?: number };

// Prefer Upstash Redis if configured, else in-memory fallback
const UP_URL = process.env.UPSTASH_REDIS_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = UP_URL && UP_TOKEN ? new Redis({ url: UP_URL, token: UP_TOKEN }) : null;

const globalAny: any = globalThis as any;
if (!globalAny.__routeBuckets) globalAny.__routeBuckets = new Map<string, Bucket>();
const buckets: Map<string, Bucket> = globalAny.__routeBuckets;

async function take(key: string, capacity: number, refillPerSec: number) {
  const now = Date.now();
  if (!redis) {
    let b = buckets.get(key);
    if (!b) {
      b = { tokens: capacity - 1, lastRefill: now };
      buckets.set(key, b);
      return true;
    }
    const elapsed = (now - b.lastRefill) / 1000;
    b.tokens = Math.min(capacity, b.tokens + elapsed * refillPerSec);
    b.lastRefill = now;
    if (b.tokens >= 1) {
      b.tokens -= 1;
      return true;
    }
    return false;
  }
  // Upstash-backed: store JSON state per key
  const k = `rate:${key}`;
  const state = (await redis.get<Bucket>(k)) ?? { tokens: capacity, lastRefill: now };
  const elapsed = (now - state.lastRefill) / 1000;
  state.tokens = Math.min(capacity, state.tokens + elapsed * refillPerSec);
  state.lastRefill = now;
  if (state.tokens >= 1) {
    state.tokens -= 1;
    // keep for up to 10 minutes of inactivity
    await redis.set(k, state, { ex: 600 });
    return true;
  }
  await redis.set(k, state, { ex: 600 });
  return false;
}

export async function rateGate(req: Request, name: string, opts?: Options) {
  const allowRateInTest = process.env.ENABLE_RATE_LIMIT_TESTS === "true";
  if (process.env.NODE_ENV === "test" && !allowRateInTest) return null;
  const capacity = opts?.capacity ?? 30;
  const refillPerSec = opts?.refillPerSec ?? 0.5;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const key = `${ip}:${name}`;
  const ok = await take(key, capacity, refillPerSec);
  if (!ok) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  return null;
}

export async function rateGateFromNextRequest(req: NextRequest, name: string, opts?: Options) {
  const allowRateInTest = process.env.ENABLE_RATE_LIMIT_TESTS === "true";
  if (process.env.NODE_ENV === "test" && !allowRateInTest) return null;
  const capacity = opts?.capacity ?? 30;
  const refillPerSec = opts?.refillPerSec ?? 0.5;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const key = `${ip}:${name}`;
  const ok = await take(key, capacity, refillPerSec);
  if (!ok) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  return null;
}

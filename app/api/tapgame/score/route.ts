import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rateGateFromNextRequest } from "@/app/api/_lib/rate";

export const dynamic = "force-dynamic";

type ScorePayload = {
  gameId?: string | null;
  trackId?: string | null;
  difficulty?: string | null;
  score?: number | null;
  accuracy?: number | null;
  maxCombo?: number | null;
  clientHash?: string | null;
  noteCount?: number | null;
  runMs?: number | null;
  chartSeed?: number | null;
};

const MAX_SCORE = 2_000_000;
const MAX_COMBO = 10_000;
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert", "Normal", "Insane"];

function clamp(num: number, min: number, max: number) {
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function normalizeDifficulty(input?: string | null) {
  if (!input) return "Medium";
  const clean = input.trim();
  const match = DIFFICULTIES.find((d) => d.toLowerCase() === clean.toLowerCase());
  return match ?? "Medium";
}

export async function POST(req: NextRequest) {
  const limited = await rateGateFromNextRequest(req, "tapgame-score", {
    capacity: 6,
    refillPerSec: 0.25,
  });
  if (limited) return limited;

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase admin client not configured" },
      { status: 500 },
    );
  }

  let body: ScorePayload | null = null;
  try {
    body = (await req.json()) as ScorePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const trackId = (body?.trackId || "").trim();
  if (!trackId) {
    return NextResponse.json({ error: "trackId required" }, { status: 400 });
  }

  const difficulty = normalizeDifficulty(body?.difficulty);
  const gameId = (body?.gameId || trackId || "stemstation").slice(0, 128);
  const score = clamp(Number(body?.score ?? 0), 0, MAX_SCORE);
  const accuracy = clamp(Number(body?.accuracy ?? 0), 0, 100);
  const maxCombo = clamp(Number(body?.maxCombo ?? 0), 0, MAX_COMBO);
  const noteCount = clamp(Number(body?.noteCount ?? 0), 0, 800);
  const runMs = clamp(Number(body?.runMs ?? 0), 0, 300_000);
  const clientHashRaw = typeof body?.clientHash === "string" ? body.clientHash : "";
  const clientHash = clientHashRaw ? clientHashRaw.slice(0, 120) : null;

  if (!noteCount || noteCount < 8 || noteCount > 800) {
    return NextResponse.json({ error: "noteCount required" }, { status: 400 });
  }
  if (!runMs || runMs < 5_000 || runMs > 300_000) {
    return NextResponse.json({ error: "runMs required" }, { status: 400 });
  }

  const scoreCeiling = noteCount * 400;
  if (score > scoreCeiling || maxCombo > noteCount) {
    return NextResponse.json({ error: "Score payload invalid" }, { status: 400 });
  }

  const session = await auth();
  const userId = (session as any)?.user?.id ?? null;

  if (clientHash) {
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("TapGameScore")
      .select("id,score,submittedAt")
      .eq("clientHash", clientHash)
      .limit(1);
    if (!existingErr && existing?.length) {
      return NextResponse.json({
        ok: true,
        id: existing[0].id,
        duplicate: true,
      });
    }
  }

  const payload = {
    gameId,
    trackId,
    difficulty,
    score,
    accuracy,
    maxCombo,
    clientHash,
    userId,
  };

  const { data, error } = await supabaseAdmin
    .from("TapGameScore")
    .insert(payload)
    .select("id")
    .limit(1);

  if (error) {
    console.error("TapGame score insert failed", error);
    return NextResponse.json(
      { error: "Failed to record score", detail: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data?.[0]?.id ?? null });
}

export async function GET(req: NextRequest) {
  const limited = await rateGateFromNextRequest(req, "tapgame-leaderboard", {
    capacity: 12,
    refillPerSec: 0.5,
  });
  if (limited) return limited;

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase admin client not configured", entries: [] },
      { status: 200 },
    );
  }

  const { searchParams } = req.nextUrl;
  const trackId = searchParams.get("trackId") || undefined;
  const gameId = searchParams.get("gameId") || undefined;
  const difficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const limit = clamp(Number(searchParams.get("limit") ?? 20), 1, 50);

  let query = supabaseAdmin
    .from("TapGameScore")
    .select("userId,trackId,difficulty,score,accuracy,maxCombo,submittedAt")
    .order("score", { ascending: false })
    .order("submittedAt", { ascending: true })
    .limit(limit);

  if (trackId) query = query.eq("trackId", trackId);
  if (gameId) query = query.eq("gameId", gameId);
  if (searchParams.has("difficulty")) query = query.eq("difficulty", difficulty);

  const { data, error } = await query;
  if (error) {
    console.error("TapGame leaderboard query failed", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard", entries: [] },
      { status: 500 },
    );
  }

  const entries =
    data?.map((row, idx) => ({
      rank: idx + 1,
      userId: row.userId,
      trackId: row.trackId,
      difficulty: row.difficulty,
      score: row.score,
      accuracy: row.accuracy,
      maxCombo: row.maxCombo,
      submittedAt: row.submittedAt,
    })) ?? [];

  return NextResponse.json({ entries });
}

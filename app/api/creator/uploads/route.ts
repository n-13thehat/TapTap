import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const service = process.env.SUPABASE_SERVICE_ROLE as string | undefined;
const supabase = createClient(url, service || anon, { auth: { persistSession: false } });

type TapGamePayload = {
  enabled?: boolean;
  bpm?: number;
  difficulty?: string;
  priceCents?: number;
  description?: string;
  chartSeed?: number;

  stems?: string[];
};

type TapGameMeta = {
  bpm: number;
  difficulty: string;
  priceCents: number;
  description: string;
  enabled: true;
  chartSeed: number;

  stems?: string[];
};

export async function GET() {
  try {
    // Resolve current user (replace with your session helper)
    const { data: anyUser } = await supabase.from("User").select("id").order("createdAt",{ ascending:false }).limit(1);
    const userId = anyUser?.[0]?.id as string | undefined;
    if (!userId) return NextResponse.json({ rows: [] });

    const { data, error } = await supabase
      .from("Track")
      .select("id,title,status,priceCents,coverUrl,audioUrl,createdAt")
      .eq("userId", userId)
      .order("createdAt",{ ascending:false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data || []).map((t: any) => ({
      id: t.id,
      title: t.title || "Untitled",
      status: (t.status || "draft") as "draft" | "published",
      priceCents: t.priceCents ?? null,
      coverUrl: t.coverUrl ?? null,
      audioUrl: t.audioUrl ?? null,
      createdAt: t.createdAt ?? null
    }));

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, audioUrl, coverUrl, priceCents, explicit, splits, tapGame } = body || {};
    if (!audioUrl) return NextResponse.json({ error: "audioUrl required" }, { status: 400 });

    const { data: anyUser } = await supabase.from("User").select("id").order("createdAt",{ ascending:false }).limit(1);
    const userId = anyUser?.[0]?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "no user" }, { status: 401 });

    // create Track draft
    const { data, error } = await supabase
      .from("Track")
      .insert({
        userId,
        title: title || "Untitled",
        audioUrl,
        coverUrl: coverUrl || null,
        priceCents: Number.isFinite(priceCents) ? priceCents : 0,
        explicit: !!explicit,
        status: "draft"
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // optional: splits
    if (Array.isArray(splits) && splits.length) {
      const rows = splits
        .filter((s: any)=> s && s.addressOrUser && Number.isFinite(s.percent))
        .map((s: any)=> ({ trackId: data.id, addressOrUser: String(s.addressOrUser), percent: Number(s.percent) }));
      if (rows.length) {
        const { error: sErr } = await supabase.from("Split").upsert(rows);
        if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
      }
    }

    const tapGameMeta = buildTapGameMeta(tapGame);
    if (tapGameMeta) {
      await syncTapGameMeta(data.id, tapGameMeta);
      await syncTapGameProduct(data.id, title || "Untitled", coverUrl || null, tapGameMeta, userId);
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "save failed" }, { status: 500 });
  }
}

function buildTapGameMeta(payload?: TapGamePayload): TapGameMeta | null {
  if (!payload?.enabled) return null;
  const bpm = Number.isFinite(payload.bpm as number) ? Math.max(60, Math.min(220, Number(payload.bpm))) : 128;
  const difficulty =
    typeof payload.difficulty === "string" && payload.difficulty.trim() ? payload.difficulty.trim() : "Hard";
  const payloadPriceCents = typeof payload.priceCents === "number" ? payload.priceCents : NaN;
  const priceCents = Number.isFinite(payloadPriceCents) ? Math.max(0, Math.floor(payloadPriceCents)) : 0;
  const description = (payload.description?.trim() || "TapGame chart").replace(/[\r\n]+/g, " ");
  const chartSeed = coerceChartSeed(payload.chartSeed, bpm, difficulty, description);
  return { bpm, difficulty, priceCents, description, enabled: true, chartSeed ,
    stems: (Array.isArray(payload?.stems) && payload!.stems!.length ? payload!.stems! : undefined)
  };;
}

async function syncTapGameMeta(trackId: string, meta: TapGameMeta) {
  try {
    const existing = await prisma.track.findUnique({ where: { id: trackId }, select: { meta: true } });
    const nextMeta = (existing?.meta && typeof existing.meta === "object")
      ? { ...existing.meta, tapGame: meta }
      : { tapGame: meta };
    await prisma.track.update({ where: { id: trackId }, data: { meta: nextMeta } });
  } catch (error) {
    console.error("TapGame meta sync failed", error);
  }
}

async function syncTapGameProduct(trackId: string, title: string, cover: string | null, meta: TapGameMeta, ownerId: string) {
  const tag = `tapgame:${trackId}`;
  const productPayload = {
    title: `${title} TapGame Add-on`,
    desc: `${meta.description} (${tag})`,
    priceCents: meta.priceCents,
    coverArt: cover || null,
    ownerId,
    inventory: 999,
    images: cover ? [cover] : null,
  };

  try {
    const { data: existing, error } = await supabase
      .from("Product")
      .select("id")
      .ilike("desc", `%${tag}%`)
      .limit(1);
    if (error) throw error;
    if (existing && existing.length) {
      await supabase.from("Product").update(productPayload).eq("id", existing[0].id);
    } else {
      await supabase.from("Product").insert(productPayload);
    }
  } catch (err) {
    console.error("TapGame product sync failed", err);
  }
}

function coerceChartSeed(seedValue: number | undefined, bpm: number, difficulty: string, description: string) {
  if (Number.isFinite(seedValue)) {
    const numeric = Math.abs(Math.floor(seedValue as number));
    if (numeric > 0) return numeric;
  }
  const payload = `${description}|${bpm}|${difficulty}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}



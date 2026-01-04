import { NextResponse } from "next/server";
import { registerTrackWithBmi } from "@/lib/bmi";
import { requireSupabaseUser } from "@/lib/server/supabase";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireSupabaseUser();
    const body = await request.json();
    const trackId = typeof body?.trackId === "string" ? body.trackId : "";
    if (!trackId) {
      return NextResponse.json({ error: "trackId is required" }, { status: 400 });
    }

    const { data: track, error } = await supabase
      .from("Track")
      .select("id,title,priceCents,coverUrl,audioUrl,createdAt,status,meta,durationMs")
      .eq("userId", user.id)
      .eq("id", trackId)
      .single();

    if (error || !track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.status !== "published") {
      return NextResponse.json({ error: "Only published tracks can be registered" }, { status: 400 });
    }

    await registerTrackWithBmi(user.id, {
      trackId: track.id,
      title: track.title,
      priceCents: track.priceCents ?? null,
      coverUrl: track.coverUrl ?? null,
      audioUrl: track.audioUrl ?? null,
      durationMs: track.durationMs ?? null,
      mintedAt: track.createdAt ?? null,
      metadata: track.meta ?? null,
    });

    return NextResponse.json({
      ok: true,
      message: `Track "${track.title}" queued for BMI registration.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "BMI registration failed" },
      { status: 500 }
    );
  }
}

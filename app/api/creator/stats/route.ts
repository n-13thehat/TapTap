import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const service = process.env.SUPABASE_SERVICE_ROLE as string | undefined;

// Server-side client: prefer service role to read across RLS; fallback to anon
const supabase = createClient(url, service || anon, { auth: { persistSession: false } });

export async function GET() {
  try {
    // Resolve creator by request context (replace with your auth helper if you have one)
    // For now, get the current authenticated user if available
    let userId: string | null = null;
    try {
      // If you attach a cookie/JWT resolver, wire it here. Otherwise this dummy lookup uses the latest user as placeholder.
      const { data } = await supabase.from("User").select("id").order("createdAt",{ ascending:false }).limit(1);
      userId = data?.[0]?.id ?? null;
    } catch {}

    if (!userId) return NextResponse.json({ plays: 0, saves: 0, sales: 0, views: 0 });

    // Plays (sum of play events on tracks owned by this creator)
    const { data: myTracks } = await supabase.from("Track").select("id,userId").eq("userId", userId).limit(1000);
    const ids = (myTracks || []).map(t => (t as any).id);
    let plays = 0, saves = 0, sales = 0, views = 0;

    if (ids.length) {
      const { count: playCount } = await supabase.from("PlayEvent").select("id",{ count: "exact", head: true }).in("trackId", ids);
      plays = playCount || 0;

      const { count: saveCount } = await supabase.from("Save").select("id",{ count: "exact", head: true }).in("trackId", ids);
      saves = saveCount || 0;

      // either OrderItem or Order.items JSON — try OrderItem first
      const { count: salesCount } = await supabase.from("OrderItem").select("id",{ count: "exact", head: true }).in("trackId", ids);
      sales = (salesCount || 0);
      // naive views (landing page hits)
      const { count: viewCount } = await supabase.from("TrackView").select("id",{ count: "exact", head: true }).in("trackId", ids);
      views = viewCount || 0;
    }

    return NextResponse.json({ plays, saves, sales, views });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "stats failed" }, { status: 500 });
  }
}
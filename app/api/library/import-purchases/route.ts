import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

export async function POST() {
  try {
    // Expect user to be authenticated upstream (e.g., middleware attaches user id)
    // If you have RLS, use service role here instead of anon, or read user id off cookies/JWT.
    const userId = ""; // TODO: inject your auth user id here if you have a helper. For now we attempt best-effort via Orders table.
    // Find latest orders and build ids
    const { data: orders, error: ordErr } = await supabase
      .from("Order")
      .select("id,items,userId,createdAt")
      .order("createdAt",{ ascending:false })
      .limit(10);
    if (ordErr) return NextResponse.json({ error: ordErr.message }, { status: 500 });

    const trackIds = new Set<string>(); const albumIds = new Set<string>();
    for (const o of orders || []) {
      const arr = Array.isArray((o as any).items) ? (o as any).items : [];
      for (const it of arr) {
        const t = (it && (it.trackId || (it as any).track_id)) as string | undefined;
        const a = (it && (it.albumId || (it as any).album_id)) as string | undefined;
        if (t) trackIds.add(t);
        if (a) albumIds.add(a);
        const url = (it && ((it as any).url || (it as any).href)) as string | undefined;
        if (url && /track\/[0-9a-f\-]{10,}/i.test(url)) { const m = url.match(/track\/([0-9a-f\-]{10,})/i); if (m) trackIds.add(m[1]); }
        if (url && /album\/[0-9a-f\-]{10,}/i.test(url)) { const m = url.match(/album\/([0-9a-f\-]{10,})/i); if (m) albumIds.add(m[1]); }
      }
    }

    // Resolve/create Library for each order owner (simple: first order's user)
    const libOwner = (orders && orders[0] && (orders[0] as any).userId) as string | undefined;
    if (!libOwner) return NextResponse.json({ error: "No user for orders." }, { status: 400 });

    // Get/create Library row
    let libId: string | undefined;
    const { data: libRow } = await supabase.from("Library").select("id").eq("userId", libOwner).single();
    if (libRow?.id) libId = libRow.id;
    else {
      const { data: created, error: cErr } = await supabase.from("Library").insert({ userId: libOwner }).select("id").single();
      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
      libId = created?.id;
    }

    if (!libId) return NextResponse.json({ error: "No library id." }, { status: 500 });

    let added = 0;
    if (trackIds.size) {
      const rows = Array.from(trackIds).map(tid => ({ libraryId: libId, trackId: tid }));
      const { error } = await supabase.from("LibraryItem").upsert(rows, { ignoreDuplicates: true });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      added += rows.length;
    }
    // (Optional) add albums by pulling their first track
    if (albumIds.size) {
      const { data: tracks, error: tErr } = await supabase
        .from("Track")
        .select("id,albumId")
        .in("albumId", Array.from(albumIds))
        .order("createdAt",{ ascending:true })
        .limit(1000);
      if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
      const firsts = new Map<string,string>();
      for (const t of tracks || []) {
        const a = (t as any).albumId as string; const id = (t as any).id as string;
        if (a && id && !firsts.has(a)) firsts.set(a, id);
      }
      const rows = Array.from(firsts.values()).map(tid => ({ libraryId: libId, trackId: tid }));
      if (rows.length) {
        const { error } = await supabase.from("LibraryItem").upsert(rows, { ignoreDuplicates: true });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        added += rows.length;
      }
    }

    return NextResponse.json({ ok: true, added });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Import failed" }, { status: 500 });
  }
}
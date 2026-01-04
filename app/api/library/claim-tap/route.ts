import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

export async function POST(req: Request) {
  try {
    const { tapPayload } = await req.json();
    if (!tapPayload) return NextResponse.json({ error: "No payload" }, { status: 400 });

    // Parse track/album IDs or URLs from payload
    const lines = String(tapPayload).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const trackIds = new Set<string>(), albumIds = new Set<string>();
    for (const s of lines) {
      if (/^trk[_-]?[0-9a-f]{6,}$/i.test(s)) trackIds.add(s);
      if (/^alb[_-]?[0-9a-f]{6,}$/i.test(s)) albumIds.add(s);
      if (/track\/([0-9a-f\-]{10,})/i.test(s)) { const m = s.match(/track\/([0-9a-f\-]{10,})/i); if (m) trackIds.add(m[1]); }
      if (/album\/([0-9a-f\-]{10,})/i.test(s)) { const m = s.match(/album\/([0-9a-f\-]{10,})/i); if (m) albumIds.add(m[1]); }
    }

    // Resolve user from your auth (replace with your session helper)
    // For now, best-effort: pick a single test user or return error if none.
    const { data: anyUser } = await supabase.from("User").select("id").limit(1);
    const userId = anyUser?.[0]?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "No user context" }, { status: 401 });

    // Get/create Library row
    let libId: string | undefined;
    const { data: libRow } = await supabase.from("Library").select("id").eq("userId", userId).single();
    if (libRow?.id) libId = libRow.id;
    else {
      const { data: created, error: cErr } = await supabase.from("Library").insert({ userId }).select("id").single();
      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
      libId = created?.id;
    }
    if (!libId) return NextResponse.json({ error: "No library id" }, { status: 500 });

    // If album IDs present, pick first tracks
    if (albumIds.size) {
      const { data: tracks, error } = await supabase
        .from("Track")
        .select("id,albumId")
        .in("albumId", Array.from(albumIds))
        .order("createdAt",{ ascending:true })
        .limit(1000);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      for (const t of tracks || []) {
        const a = (t as any).albumId as string; const id = (t as any).id as string;
        if (a && id) trackIds.add(id);
      }
    }

    const rows = Array.from(trackIds).map(tid => ({ libraryId: libId, trackId: tid }));
    if (!rows.length) return NextResponse.json({ error: "No recognizable items" }, { status: 400 });

    const { error: upErr } = await supabase.from("LibraryItem").upsert(rows, { ignoreDuplicates: true });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, added: rows.length });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Claim failed" }, { status: 500 });
  }
}
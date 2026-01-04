import { NextResponse } from "next/server";
import { ytFetch } from "../_lib/youtube";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const max = Math.max(1, Math.min(25, Number(searchParams.get("max") || "12")));
    if (!q) return NextResponse.json({ items: [] });

    const data = await ytFetch<any>("search", {
      part: "snippet",
      type: "video",
      maxResults: max,
      q,
    });

    const items = (data.items || [])
      .map((it: any) => {
        const id = it?.id?.videoId ?? it?.id;
        const sn = it?.snippet;
        if (!id || !sn) return null;
        return {
          id,
          title: sn.title,
          channelTitle: sn.channelTitle,
          thumbnail: sn.thumbnails?.high?.url || sn.thumbnails?.medium?.url || sn.thumbnails?.default?.url,
          publishedAt: sn.publishedAt,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "search failed" }, { status: 500 });
  }
}

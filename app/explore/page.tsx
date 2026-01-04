"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type TrendItem = { id: string; title: string; channel: string; thumb: string };
type TrackItem = { id: string; title: string; artist?: { stageName?: string | null } };

function ExploreContent() {
  const searchParams = useSearchParams();
  const embed = String(searchParams?.get("embed") ?? "") === "1";
  const [trending, setTrending] = useState<TrendItem[]>([]);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    async function load() {
      setLoading(true); setErr(null);
      try {
        const [yt, tk] = await Promise.all([
          fetch("/api/surf/trending?region=US&max=12", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/tracks?limit=12", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (!done) {
          const ytItems = Array.isArray(yt?.items) ? yt.items : [];
          const trackItems =
            Array.isArray(tk?.items) ? tk.items :
            Array.isArray(tk) ? tk :
            [];
          setTrending(ytItems as TrendItem[]);
          setTracks(trackItems as TrackItem[]);
        }
      } catch (e: any) {
        if (!done) setErr(e?.message || "Failed to load explore");
      } finally {
        if (!done) setLoading(false);
      }
    }
    load();
    return () => { done = true; };
  }, []);

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30" />
        <h1 className="text-lg font-semibold text-teal-300">Explore</h1>
      </div>
      {!embed && <Link href={`/home?tab=explore`} className="text-sm text-white/80 underline">Open in Home</Link>}
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#031a1a] text-white relative">
      <section className="relative z-10 mx-auto max-w-7xl p-4 space-y-6">
        {header}
        {err && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-200">{err}</div>}
        {loading && <div className="text-white/70">Loading…</div>}

        <div className="space-y-3">
          <div className="text-sm font-semibold text-white/80">Trending Videos</div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {trending.map((v) => (
              <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" className="group rounded-xl overflow-hidden border border-white/10 bg-white/5">
                <div className="relative aspect-video">
                  {v.thumb ? (
                    <Image src={v.thumb} alt={v.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-black/40" />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm text-white/60 truncate" title={v.channel}>{v.channel}</div>
                  <div className="font-medium line-clamp-2">{v.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-white/80">Latest Tracks</div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {tracks.map((t: any) => (
              <Link key={t.id} href={`/album/${t?.albumId ?? ""}`} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
                <div className="font-medium truncate">{t.title}</div>
                <div className="text-sm text-white/70">{t.artist?.stageName ?? ""}</div>
              </Link>
            ))}
          </div>
        </div>

        {!loading && trending.length === 0 && tracks.length === 0 && !err && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">Nothing to explore yet</div>
        )}
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-black to-[#031a1a] text-white relative">
        <section className="relative z-10 mx-auto max-w-7xl p-4 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30" />
            <h1 className="text-lg font-semibold text-teal-300">Explore</h1>
          </div>
          <div className="text-white/70">Loading…</div>
        </section>
      </main>
    }>
      <ExploreContent />
    </Suspense>
  );
}



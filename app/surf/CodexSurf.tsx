"use client";
import React, { useMemo, useState } from "react";
import { usePlayerStore } from "@/stores/player";
import Link from "next/link";

export default function CodexSurf() {
  const allowanceCfg = "25/day";
  const qualityCap = "720p";
  const perDay = useMemo(()=> Number(String(allowanceCfg).split('/')[0] || '0') || 0, [allowanceCfg]);
  const [remaining, setRemaining] = useState(perDay);
  const { queue, setQueueList, playTrack, addToQueue } = usePlayerStore() as any;
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#041a1a] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30" />
            <div className="text-lg font-semibold text-teal-300">Surf</div>
          </div>
          <Link href="/library" className="text-sm text-white/80 underline">Library</Link>
        </div>
      </header>
      <section className="mx-auto max-w-5xl p-4 space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/80">Allowance</div>
            <div className="text-sm text-white/60">{allowanceCfg} â€¢ Cap {qualityCap}</div>
          </div>
          <div className="mt-2 h-2 w-full rounded bg-black/40">
            <div className="h-2 rounded bg-teal-400/70" style={{ width: `${Math.max(0, Math.min(100, (remaining/perDay)*100))}%` }} />
          </div>
          <div className="mt-2 text-xs text-white/60">{remaining} of {perDay} remaining today</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="font-semibold mb-2">Search</div>
          <div className="flex gap-2">
            <input placeholder="Search videos" className="flex-1 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm" />
            <button className="rounded border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/20">Search</button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="aspect-video rounded bg-black/40 mb-3" />
              <div className="font-medium">Result {i+1}</div>
              <div className="text-sm text-white/60">Tap to play (caps {qualityCap})</div>
              <button onClick={() => {
                const sampleId = 'QH2-TGUlwu4';
                const track: any = { id: sampleId, title: `Surf Result ${i+1}`, artist: 'Source', audio_url: `/api/surf/audio?videoId=${sampleId}` };
                const exists = queue?.find?.((t: any) => t.id === sampleId);
                if (!exists) {
                  addToQueue?.(track);
                }
                playTrack?.(track);
                setRemaining(r=>Math.max(0, r-1));
              }} className="mt-2 rounded border border-teal-500/30 bg-teal-400/10 px-3 py-1 text-sm text-teal-300 hover:bg-teal-400/20">Play</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

Import-Module "$PSScriptRoot/Util.psm1" -Force
function Invoke-LibraryArchitect {
  [CmdletBinding()]
  param(
    [string]$Theme = "matrixTeal",
    [ValidateSet("left","right")][string]$Queue = "right",
    [bool]$WaveSurfer = $true,
    [bool]$RightRail = $true,
    [string]$Route = "app/library/CodexLibrary.tsx"
  )
  Write-Step "Scaffolding Library page (queue=$Queue, wavesurfer=$WaveSurfer)"
  $dir = Split-Path $Route -Parent; Ensure-Dir $dir
  $queueCol = if ($RightRail) { if ($Queue -eq 'left') { 'lg:grid-cols-[320px_1fr_320px]' } else { 'lg:grid-cols-[320px_1fr_360px]' } } else { 'lg:grid-cols-[320px_1fr]' }
  $waveExpr = if ($WaveSurfer) { "dynamic(()=>import('wavesurfer.js'),{ssr:false})" } else { "null as any" }
  $tsx = @'
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

type Track = { id: string; title: string; artist: string; cover: string; url?: string };

const WaveSurfer = __WAVE_EXPR__;

function useLocalCache(key: string, initial: any) {
  const [val, setVal] = useState<any>(() => {
    if (typeof window === 'undefined') return initial;
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal] as const;
}

function QueuePanel({ items, currentId, onSelect }: { items: Track[]; currentId: string | null; onSelect: (id: string)=>void }) {
  return (
    <aside className="space-y-2">
      <div className="text-sm font-semibold text-teal-300">Queue</div>
      <div className="space-y-2">
        {items.map(t => (
          <button key={t.id} onClick={()=>onSelect(t.id)} className={`w-full flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-2 text-left ${currentId===t.id?'ring-1 ring-teal-400/50':''}`}>
            <div className="relative h-10 w-10 overflow-hidden rounded">
              <Image src={t.cover} alt={t.title} fill className="object-cover" />
            </div>
            <div className="truncate">
              <div className="truncate text-sm font-medium">{t.title}</div>
              <div className="truncate text-xs text-white/60">{t.artist}</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default function CodexLibrary() {
  const [recent, setRecent] = useLocalCache('library.recent', [] as Track[]);
  const [queue, setQueue] = useLocalCache('library.queue', [] as Track[]);
  const [currentId, setCurrentId] = useState<string | null>(queue[0]?.id ?? null);

  // Demo data fallback
  useEffect(() => {
    if ((queue as any).length === 0) {
      const demo: Track[] = Array.from({ length: 8 }).map((_, i) => ({ id: `d${i}`, title: `Demo Track ${i+1}`, artist: 'Unknown', cover: '/branding/cropped_tap_logo.png' }));
      setQueue(demo);
      setCurrentId(demo[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = useMemo(() => queue.find((t: Track) => t.id === currentId) ?? null, [queue, currentId]);

  const wsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!WaveSurfer || !containerRef.current) return;
    let ws: any; let cancelled = false;
    (async () => {
      try {
        const WS = (await import('wavesurfer.js')).default;
        ws = WS.create({ container: containerRef.current!, waveColor: '#1e293b', progressColor: '#14b8a6', cursorColor: '#22d3ee', height: 48, barWidth: 2, normalize: true });
        wsRef.current = ws;
      } catch {}
    })();
    return () => { try { ws?.destroy?.() } catch {} cancelled = true };
  }, []);

  useEffect(() => {
    // Track current to recent cache
    if (!current) return;
    setRecent((prev: Track[]) => {
      const dedup = [current, ...prev.filter(p => p.id !== current.id)].slice(0, 25);
      return dedup;
    });
  }, [current, setRecent]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#041a1a] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30" />
            <div className="text-lg font-semibold text-teal-300">Library</div>
          </div>
          <Link href="/upload" className="text-sm text-white/80 underline">Upload</Link>
        </div>
      </header>
      <section className={`mx-auto max-w-7xl grid grid-cols-1 __QUEUE_COL__ gap-4 p-4`}>
        <div className="hidden lg:block">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-2 text-sm font-semibold text-white/80">Filters</div>
            <div className="text-xs text-white/60">Theme: __THEME__</div>
          </div>
        </div>
        <div className="space-y-4">
          {current && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded">
                  <Image src={current.cover} alt={current.title} fill className="object-cover" />
                </div>
                <div>
                  <div className="text-sm text-white/60">Now Playing</div>
                  <div className="font-medium">{current.title}</div>
                  <div className="text-sm text-white/60">{current.artist}</div>
                </div>
              </div>
              <div ref={containerRef} className="mt-3" />
            </div>
          )}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-white/80">Recently Played</div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {recent.map((t: Track) => (
                <button key={t.id} onClick={()=>setCurrentId(t.id)} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded">
                      <Image src={t.cover} alt={t.title} fill className="object-cover" />
                    </div>
                    <div className="truncate">
                      <div className="truncate font-medium">{t.title}</div>
                      <div className="truncate text-sm text-white/60">{t.artist}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 sticky top-20">
            <QueuePanel items={queue} currentId={currentId} onSelect={setCurrentId} />
          </div>
        </div>
      </section>
    </main>
  );
}
'@
  $tsx = $tsx.Replace("__WAVE_EXPR__", $waveExpr).Replace("__QUEUE_COL__", $queueCol).Replace("__THEME__", $Theme)
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText((Resolve-Path (New-Item -ItemType File -Force -Path $Route)),$tsx,$utf8)
  Write-Next "Next steps:"
  Write-Todo "Integrate Supabase library/albums and playlists"
  Write-Todo "Hook global player store for play/pause/seek"
  Write-Todo "Persist queue to IndexedDB for offline"
}
Export-ModuleMember -Function Invoke-LibraryArchitect

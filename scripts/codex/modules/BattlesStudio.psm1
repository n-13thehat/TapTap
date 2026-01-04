Import-Module "$PSScriptRoot/Util.psm1" -Force
function Invoke-BattlesStudio {
  [CmdletBinding()]
  param(
    [string]$RoutePage = "app/battles/page.tsx",
    [string]$RouteApi  = "app/api/battles/route.ts",
    [ValidateSet("recent","popular")][string]$Sort = "recent",
    [int]$MaxResults = 24
  )
  Write-Step "Checking YOUTUBE_API_KEY in environment"
  $hasKey = $false
  foreach($p in @(".env.local",".env")){
    if(Test-Path $p){ if( (Get-Content $p -Raw) -match "YOUTUBE_API_KEY\s*=") { $hasKey = $true } }
  }
  if(-not $hasKey -and $env:YOUTUBE_API_KEY){ $hasKey = $true }
  if(-not $hasKey){ Write-Todo "Add YOUTUBE_API_KEY=your_key to .env.local" }

  Write-Step "Ensure leagues config"
  $cfgPath = Join-Path (Resolve-Path ".").Path "config/battles.leagues.json"
  $cfgDir = Split-Path $cfgPath -Parent
  Ensure-Dir $cfgDir
  if(-not (Test-Path $cfgPath)){
    $seed = @'
{
  "leagues": [
    { "name": "URL (SMACK/Ultimate Rap League)", "channels": [ { "title": "Ultimate Rap League", "channelId": "UCYkq8J0QmS9B3rR9f7D7xVg" } ], "playlists": [ { "title": "URL – Recent Battles", "playlistId": "" } ] },
    { "name": "BullPen Battle League", "channels": [ { "title": "BullPen Battle League", "channelId": "UCk0S7m8xxxxxPLACEHOLDER" } ], "playlists": [] },
    { "name": "King Of The Dot", "channels": [ { "title": "KOTD - King Of The Dot", "channelId": "UCQ7Dq9xxxxxPLACEHOLDER" } ], "playlists": [] },
    { "name": "RBE (Rare Breed Ent.)", "channels": [ { "title": "Rare Breed Ent", "channelId": "UCpQeZxxxxxPLACEHOLDER" } ], "playlists": [] }
  ]
}
'@
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($cfgPath,$seed,$utf8)
  }

  Write-Step "Scaffolding API route: $RouteApi"
  $apiDir = Split-Path $RouteApi -Parent; Ensure-Dir $apiDir
  $apiTs = @'
import { NextResponse } from "next/server";
import leaguesConfig from "../../../config/battles.leagues.json";

const API = "https://www.googleapis.com/youtube/v3";

type League = {
  name: string;
  channels?: { title: string; channelId: string }[];
  playlists?: { title: string; playlistId: string }[];
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sort = (url.searchParams.get("sort") || "recent") as "recent" | "popular";
  const maxResults = Math.min(parseInt(url.searchParams.get("maxResults") || "24", 10), 50);
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "Missing YOUTUBE_API_KEY" }, { status: 500 });
  }

  const leagues = (leaguesConfig as any).leagues as League[];

  const order = sort === "popular" ? "viewCount" : "date";

  async function fetchChannelBattles(channelId: string) {
    const params = new URLSearchParams({
      key: YOUTUBE_API_KEY!,
      part: "snippet",
      channelId,
      maxResults: String(Math.min(maxResults, 50)),
      order,
      type: "video",
      q: "battle",
      safeSearch: "none",
    });
    const r = await fetch(`${API}/search?${params.toString()}`, { cache: "no-store" });
    const j = await r.json();
    return (j.items || []).map((it: any) => ({
      id: it.id?.videoId,
      title: it.snippet?.title,
      channelTitle: it.snippet?.channelTitle,
      publishedAt: it.snippet?.publishedAt,
      thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url,
      url: it.id?.videoId ? `https://www.youtube.com/watch?v=${it.id.videoId}` : null,
      leagueHint: "channel",
    }));
  }

  async function fetchPlaylistBattles(playlistId: string) {
    const params = new URLSearchParams({
      key: YOUTUBE_API_KEY!,
      part: "snippet",
      maxResults: String(Math.min(maxResults, 50)),
      playlistId,
    });
    const r = await fetch(`${API}/playlistItems?${params.toString()}`, { cache: "no-store" });
    const j = await r.json();
    return (j.items || []).map((it: any) => ({
      id: it.snippet?.resourceId?.videoId,
      title: it.snippet?.title,
      channelTitle: it.snippet?.videoOwnerChannelTitle || it.snippet?.channelTitle,
      publishedAt: it.snippet?.publishedAt,
      thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url,
      url: it.snippet?.resourceId?.videoId ? `https://www.youtube.com/watch?v=${it.snippet.resourceId.videoId}` : null,
      leagueHint: "playlist",
    }));
  }

  const tasks: Promise<any[]>[] = [];
  for (const lg of leagues) {
    for (const ch of lg.channels || []) tasks.push(fetchChannelBattles(ch.channelId));
    for (const pl of lg.playlists || []) tasks.push(fetchPlaylistBattles(pl.playlistId));
  }

  const results = (await Promise.allSettled(tasks))
    .flatMap((s: any) => (s.status === "fulfilled" ? s.value : []))
    .filter(Boolean);

  const seen = new Set<string>();
  const unique = results.filter((v: any) => {
    if (!v.id) return false;
    if (seen.has(v.id)) return false;
    seen.add(v.id); return true;
  });

  unique.sort((a: any, b: any) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

  return NextResponse.json({ sort, count: unique.length, items: unique.slice(0, maxResults) });
}
'@
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText((Resolve-Path (New-Item -ItemType File -Force -Path $RouteApi)),$apiTs,$utf8)

  Write-Step "Scaffolding Battles page: $RoutePage"
  $pageDir = Split-Path $RoutePage -Parent; Ensure-Dir $pageDir
  $pageTsx = @'
"use client";

import { useEffect, useState } from "react"

type BattleItem = {
  id: string
  title: string
  channelTitle: string
  publishedAt: string
  thumbnail?: string
  url?: string
}

export default function BattlesPage(){
  const [sort,setSort] = useState<"recent"|"popular">("recent")
  const [items,setItems] = useState<BattleItem[]>([])
  const [loading,setLoading] = useState(false)
  const [err,setErr] = useState<string | null>(null)

  async function load(){
    setLoading(true); setErr(null)
    try{
      const r = await fetch(`/api/battles?sort=${sort}&maxResults=${24}`, { cache: "no-store" })
      const j = await r.json()
      if(!r.ok) throw new Error(j?.error || "Failed to load battles")
      setItems(j.items || [])
    } catch(e:any){
      setErr(e.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() },[sort])

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">TapTap Battles</h1>
          <div className="flex items-center gap-2">
            <button onClick={()=>setSort("recent")} className={`px-3 py-2 rounded-lg ${sort==="recent"?"bg-teal-600":"bg-zinc-800 hover:bg-zinc-700"}`}>Recent</button>
            <button onClick={()=>setSort("popular")} className={`px-3 py-2 rounded-lg ${sort==="popular"?"bg-teal-600":"bg-zinc-800 hover:bg-zinc-700"}`}>Popular</button>
          </div>
        </div>

        {loading && <div className="text-zinc-400">Loading battles…</div>}
        {err && <div className="text-red-400">{err}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(v=> (
            <a key={v.id} href={v.url || "#"} target="_blank" rel="noreferrer" className="group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/60 hover:border-teal-700 transition">
              {v.thumbnail ? (
                <img src={v.thumbnail} alt={v.title} className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video bg-zinc-900" />
              )}
              <div className="p-3">
                <div className="text-sm text-zinc-400">{v.channelTitle}</div>
                <div className="font-medium group-hover:text-white line-clamp-2">{v.title}</div>
                <div className="text-xs text-zinc-500 mt-1">{new Date(v.publishedAt).toLocaleString()}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
'@
  [IO.File]::WriteAllText((Resolve-Path (New-Item -ItemType File -Force -Path $RoutePage)),$pageTsx,$utf8)
  Write-Next "Battles Studio ready"
  Write-Todo "Confirm YouTube channel/playlists IDs in config/battles.leagues.json"
  Write-Todo "Add YOUTUBE_API_KEY to .env.local and restart dev server"
}
Export-ModuleMember -Function Invoke-BattlesStudio


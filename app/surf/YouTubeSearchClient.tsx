"use client";
import React, { useEffect, useState, useTransition } from "react";
import { getYouTubeResults } from "./actions";
import { usePlayerStore } from "@/stores/player";
import MatrixYouTubePlayer from "@/components/MatrixYouTubePlayer";
import { Play, Plus, ListPlus, BookmarkPlus } from "lucide-react";

type Result = { id: string; title: string; channelTitle: string; thumbnail?: string; publishedAt?: string; };
const STORAGE_KEY = "taptap_surf_saved_videos";

export default function YouTubeSearchClient({
  initialQuery = "",
  initialResults = null,
  initialPlaylists = [],
}: {
  initialQuery?: string;
  initialResults?: Result[] | null;
  initialPlaylists?: { id: string; title: string }[];
}) {
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState<Result[] | null>(initialResults);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { playTrack } = (usePlayerStore() as any) || {};

  const [activeVideo, setActiveVideo] = useState<Result | null>(initialResults?.[0] ?? null);
  const [savedVideos, setSavedVideos] = useState<Result[]>([]);

  const [playlists, setPlaylists] = useState<{id: string; title: string;}[]>(initialPlaylists || []);
  const [activePl, setActivePl] = useState<string>("");

  async function loadPlaylists() {
    try {
      const r = await fetch("/api/surf/playlists", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setPlaylists((prev) => (prev?.length ? prev : (j.items || [])));
    } catch {}
  }

  useEffect(() => {
    loadPlaylists();
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedVideos(parsed);
      }
    } catch {}
  }, []);

  const onSearch = () => {
    setError(null);
    setResults(null);
    startTransition(async () => {
      try {
        const r = await getYouTubeResults(q);
        setResults(r);
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    });
  };

  async function addToPlaylist(video: Result) {
    if (!activePl) { alert("Pick a playlist first"); return; }
    const body = {
      videoId: video.id,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnail: video.thumbnail,
      publishedAt: video.publishedAt
    };
    const r = await fetch(`/api/surf/playlist/${activePl}/items`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) {
      const j = await r.json().catch(()=>({}));
      alert(j?.error || "Failed to save");
      return;
    }
  }

  const persistSaved = (items: Result[]) => {
    setSavedVideos(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
    } catch {}
  };

  const saveVideo = (video: Result) => {
    persistSaved([video, ...savedVideos.filter((v) => v.id !== video.id)]);
  };

  const enforceQueueLimit = (tracks: any[]) => {
    if (tracks.length <= 25) return tracks;
    return tracks.slice(tracks.length - 25); // keep most recent 25
  };

  function playNow(video: Result) {
    // Create track for global player
    const track: any = {
      id: video.id,
      title: video.title,
      artist: video.channelTitle || "Creator",
      // Use audio-only stream for playback
      audio_url: `/api/surf/audio?videoId=${encodeURIComponent(video.id)}`,
      artwork_url: video.thumbnail,
      duration: null,
      // Add video metadata for potential video display
      video_url: `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&controls=1&rel=0&modestbranding=1`,
      video_id: video.id,
      source: 'youtube'
    };

    try {
      const state = usePlayerStore.getState();
      const existingQueue = Array.isArray(state.queue) ? state.queue : [];
      const withoutDupes = existingQueue.filter((t: any) => t.id !== track.id);
      const nextQueue = enforceQueueLimit([...withoutDupes, track]);
      state.setQueueList(nextQueue);
      state.playTrack(track);
      setActiveVideo(video);
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  }

  function queueVideo(video: Result) {
    const track: any = {
      id: video.id,
      title: video.title,
      artist: video.channelTitle || "Creator",
      audio_url: `/api/surf/audio?videoId=${encodeURIComponent(video.id)}`,
      artwork_url: video.thumbnail,
      duration: null,
      video_url: `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=0&controls=1&rel=0&modestbranding=1`,
      video_id: video.id,
      source: 'youtube'
    };

    try {
      const state = usePlayerStore.getState();
      const existingQueue = Array.isArray(state.queue) ? state.queue : [];
      const withoutDupes = existingQueue.filter((t: any) => t.id !== track.id);
      const nextQueue = enforceQueueLimit([...withoutDupes, track]);

      // Preserve currently playing track at the front if present
      const current = (state as any).current;
      if (current) {
        const idx = nextQueue.findIndex((t: any) => t.id === current.id);
        if (idx > 0) {
          const [curr] = nextQueue.splice(idx, 1);
          nextQueue.unshift(curr);
        }
      }

      state.setQueueList(nextQueue);
      if (current) state.playTrack(current);
    } catch (error) {
      console.error('Failed to queue track:', error);
    }
  }

  async function createPlaylist() {
    const name = prompt("Playlist name");
    if (!name) return;
    const r = await fetch("/api/surf/playlists", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: name })});
    const j = await r.json();
    if (!r.ok) { alert(j?.error || "Failed"); return; }
    setPlaylists((p)=>[j.playlist, ...p]);
    setActivePl(j.playlist.id);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="text-sm text-white/80">Discover</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search music & videos"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-[260px] rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
          />
          <button
            onClick={onSearch}
            disabled={isPending}
            className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-black hover:bg-teal-500 disabled:opacity-50"
          >
            {isPending ? "Searching…" : "Search"}
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={activePl}
            onChange={(e)=>setActivePl(e.target.value)}
            className="rounded-md border border-white/10 bg-black px-2 py-2 text-sm text-white/80"
          >
            <option value="">Select playlist…</option>
            {playlists.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <button onClick={createPlaylist} className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/20">New</button>
        </div>
      </div>

      {activeVideo && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Play className="h-4 w-4 text-teal-300" />
            <span>Now playing in the global player</span>
          </div>
          <MatrixYouTubePlayer
            videoId={activeVideo.id}
            title={activeVideo.title}
            channelTitle={activeVideo.channelTitle}
            thumbnail={activeVideo.thumbnail}
            className="w-full max-h-[60vh]"
            autoplay
            controls
          />
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-md border border-rose-500/30 bg-rose-900/30 p-2 text-xs text-rose-200">Search failed. Please try again.</div>
      )}

      {results && (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {results.map((r) => (
            <li key={r.id} className="rounded border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-all duration-200">
              <div
                className="aspect-video w-full overflow-hidden rounded bg-black/40 mb-2 relative group cursor-pointer"
                onClick={() => playNow(r)}
              >
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt={r.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-teal-900/20 to-purple-900/20 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white/40" />
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="bg-teal-500/90 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-200">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>

                {/* In-app indicator */}
                <div className="absolute top-2 right-2 bg-teal-500/90 text-white text-xs px-2 py-1 rounded-full font-medium">
                  AD-FREE
                </div>
              </div>

              <div className="truncate font-medium text-white group-hover:text-teal-300 transition-colors">
                {r.title}
              </div>
              <div className="truncate text-xs text-white/60">{r.channelTitle}</div>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={(e) => {e.stopPropagation(); playNow(r);}}
                    className="flex items-center gap-1 rounded border border-teal-500/30 bg-teal-400/10 px-3 py-1 text-sm text-teal-300 hover:bg-teal-400/20 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Play
                  </button>
                  <button
                    onClick={(e) => {e.stopPropagation(); queueVideo(r);}}
                    className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80 hover:bg-white/15 transition-colors"
                  >
                    <ListPlus className="w-3 h-3" />
                    Queue
                  </button>
                  <button
                    onClick={(e) => {e.stopPropagation(); saveVideo(r);}}
                    className="flex items-center gap-1 rounded border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/20 transition-colors"
                  >
                    <BookmarkPlus className="w-3 h-3" />
                    Save
                  </button>
                </div>
                <button
                  onClick={(e) => {e.stopPropagation(); addToPlaylist(r);}}
                  className="flex items-center gap-1 rounded border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Save
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

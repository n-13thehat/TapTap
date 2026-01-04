"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Waves, Flame, ExternalLink, Play, ListVideo } from 'lucide-react';
import { Header } from './Header';
import MatrixYouTubePlayer from '@/components/MatrixYouTubePlayer';
import { usePlayerStore } from '@/stores/player';

type SavedVideo = { id: string; title: string; channelTitle?: string; thumbnail?: string };
const STORAGE_KEY = "taptap_surf_saved_videos";

export function SurfSection() {
  const [saved, setSaved] = useState<SavedVideo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasSaved = saved.length > 0;

  const setQueueList = usePlayerStore((s) => s.setQueueList);
  const playTrack = usePlayerStore((s) => s.playTrack);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSaved(parsed);
      }
    } catch {}
  }, []);

  const toTrack = (video: SavedVideo) => ({
    id: video.id,
    title: video.title || "Surf clip",
    artist: video.channelTitle || "Creator",
    audio_url: `/api/surf/audio?videoId=${encodeURIComponent(video.id)}`,
    artwork_url: video.thumbnail,
    duration: null,
    video_url: `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&controls=1&rel=0&modestbranding=1`,
    video_id: video.id,
    source: "surf",
  });

  const orderedQueue = useMemo(() => {
    if (!hasSaved) return [];
    const selected = saved[activeIndex] ?? saved[0];
    return [selected, ...saved.filter((_, idx) => idx !== (saved[activeIndex] ? activeIndex : 0))];
  }, [activeIndex, hasSaved, saved]);

  const playSaved = (index: number) => {
    if (!saved[index]) return;
    setActiveIndex(index);
    const tracks = [saved[index], ...saved.filter((_, idx) => idx !== index)].map(toTrack);
    setQueueList(tracks);
    playTrack(tracks[0]);
  };

  useEffect(() => {
    if (hasSaved) {
      playSaved(activeIndex);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSaved]);

  return (
    <section className="space-y-3">
      <Header icon={<Waves className="h-4 w-4 text-teal-300" />} title="Surf" subtitle="Discover new music" />
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">Surf the TapTap Matrix</div>
            <div className="mt-2 text-sm text-white/60">
              Discover trending tracks, explore new artists, and find your next favorite song.
            </div>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            <a
              href="/surf"
              className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-teal-500/20 p-2">
                  <Waves className="h-5 w-5 text-teal-300" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Trending Now</div>
                  <div className="text-xs text-white/60">Hot tracks from the community</div>
                </div>
                <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-white/60" />
              </div>
            </a>
            
            <a
              href="/surf/discover"
              className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-500/20 p-2">
                  <Flame className="h-5 w-5 text-purple-300" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Discover</div>
                  <div className="text-xs text-white/60">Personalized recommendations</div>
                </div>
                <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-white/60" />
              </div>
            </a>
          </div>
          
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="mb-1 flex items-center gap-2 text-white">
              <Flame className="h-4 w-4 text-amber-300" /> Beta
            </div>
            <div className="text-xs text-white/70">
              Surf is experimental and may be region-limited.
            </div>
          </div>

          {hasSaved && (
            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <ListVideo className="h-4 w-4 text-teal-300" />
                  Saved Surf queue
                </div>
                <div className="text-xs text-white/60">Plays inside this view and queues the next saved item.</div>
              </div>

              {orderedQueue[0] && (
                <div className="mb-4">
                  <MatrixYouTubePlayer
                    videoId={orderedQueue[0].id}
                    title={orderedQueue[0].title}
                    channelTitle={orderedQueue[0].channelTitle}
                    thumbnail={orderedQueue[0].thumbnail}
                    className="w-full"
                    autoplay
                    controls
                    showMatrixOverlay={false}
                  />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {saved.slice(0, 6).map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => playSaved(idx)}
                    className={`group rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-2 text-left ${idx === activeIndex ? 'ring-2 ring-teal-400/60' : ''}`}
                  >
                    <div className="aspect-video rounded bg-black/40 overflow-hidden mb-2">
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50 text-xs">No preview</div>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{v.title}</div>
                    <div className="text-[11px] text-white/60 truncate">{v.channelTitle || 'Creator'}</div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/70">
                      <Play className="h-3 w-3" />
                      Play here
                    </div>
                  </button>
                ))}
              </div>
              {saved.length > 6 && (
                <div className="mt-2 text-[11px] text-white/60">
                  {saved.length - 6} more saved — open Surf to view all.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

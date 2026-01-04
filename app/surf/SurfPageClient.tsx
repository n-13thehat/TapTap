"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Search, Waves } from "lucide-react";
import { usePlayerStore } from "@/stores/player";
import { RouteFeatureGate } from "@/components/RouteFeatureGate";

const YouTubeSearchClient = dynamic(() => import("./YouTubeSearchClient"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/70">
      Loading search…
    </div>
  ),
});

type SurfPageClientProps = {
  initialPlaylists?: { id: string; title: string }[];
};

function SurfContent({ initialPlaylists }: SurfPageClientProps) {
  const searchParams = useSearchParams();
  const { playTrack, addToQueue } = usePlayerStore();

  // Check for video player query parameters and auto-play
  useEffect(() => {
    const videoId = searchParams.get('v');
    const shouldPlay = searchParams.get('play') === 'true';

    if (videoId && shouldPlay) {
      // Fetch video details and play immediately via global player
      fetch(`/api/surf/video?id=${videoId}`)
        .then(r => r.json())
        .then(data => {
          if (data.items && data.items[0]) {
            const video = data.items[0];
            const track = {
              id: videoId,
              title: video.snippet?.title || 'Matrix stream',
              artist: video.snippet?.channelTitle || 'Creator',
              audio_url: `/api/surf/audio?videoId=${encodeURIComponent(videoId)}`,
              artwork_url: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url,
              duration: null,
              video_url: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1`,
              video_id: videoId,
              source: 'surf'
            };

            // Add to queue and play via global player
            addToQueue(track);
            playTrack(track);

            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('v');
            url.searchParams.delete('play');
            window.history.replaceState({}, '', url.toString());
          }
        })
        .catch(console.error);
    }
  }, [searchParams, playTrack, addToQueue]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <Waves className="h-6 w-6 text-emerald-300" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">TapTap Surf</div>
              <div className="text-2xl font-bold text-white">Matrix video discovery · Ad-Free</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-white/60">
            <div className="px-2 py-1 bg-teal-500/20 rounded-full text-teal-300">
              ✨ In-app player
            </div>
            <div className="px-2 py-1 bg-purple-500/20 rounded-full text-purple-300">
              🚫 No ads
            </div>
            <div className="px-2 py-1 bg-blue-500/20 rounded-full text-blue-300">
              🎵 Audio + video streaming
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Interface */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-400" />
            Search the matrix
          </h2>
          <p className="text-white/60 text-sm">
            Search and play long-form or short-form clips directly inside TapTap Matrix—no redirects.
          </p>
        </div>

        <YouTubeSearchClient />
      </div>
    </main>
  );
}

export default function SurfPageClient(props: SurfPageClientProps) {
  return (
    <RouteFeatureGate
      flag="surf"
      title="Surf is offline"
      description="Enable the Surf flag in the feature service to reopen this experience."
    >
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center">
            <div className="text-white">Loading Surf...</div>
          </div>
        }
      >
        <SurfContent initialPlaylists={props.initialPlaylists} />
      </Suspense>
    </RouteFeatureGate>
  );
}

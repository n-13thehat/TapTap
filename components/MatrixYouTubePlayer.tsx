"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Radio } from 'lucide-react';
import MatrixIframe from './MatrixIframe';
import { usePlayerStore, type Track as PlayerTrack } from '@/stores/player';

interface MatrixYouTubePlayerProps {
  videoId: string;
  title?: string;
  channelTitle?: string;
  thumbnail?: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  startTime?: number;
  endTime?: number;
  matrixIntensity?: 'subtle' | 'medium' | 'strong';
  showMatrixOverlay?: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
}

export default function MatrixYouTubePlayer({
  videoId,
  title,
  channelTitle,
  thumbnail,
  className = '',
  autoplay = false,
  controls = true,
  muted = false,
  loop = false,
  startTime,
  endTime,
  matrixIntensity = 'medium',
  showMatrixOverlay = false,
  onReady,
  onPlay,
  onPause,
  onEnd,
}: MatrixYouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { current, isPlaying, addToQueue, playTrack, pause } = usePlayerStore();

  // Build YouTube embed URL with parameters optimized for ad-free experience
  const buildYouTubeUrl = (id: string) => {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      controls: controls ? '1' : '0',
      mute: muted ? '1' : '0',
      loop: loop ? '1' : '0',
      rel: '0', // Don't show related videos
      modestbranding: '1', // Remove YouTube branding
      iv_load_policy: '3', // Disable annotations
      cc_load_policy: '0', // Disable captions by default
      playsinline: '1', // Play inline on mobile
      fs: '1', // Allow fullscreen
      hl: 'en', // Set language
      color: 'white', // Progress bar color
      disablekb: '0', // Enable keyboard controls
      enablejsapi: '1', // Enable JavaScript API
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      widget_referrer: typeof window !== 'undefined' ? window.location.origin : '',
    });

    if (startTime) params.set('start', startTime.toString());
    if (endTime) params.set('end', endTime.toString());
    if (loop && id) params.set('playlist', id);

    // Use youtube-nocookie.com for better privacy and fewer ads
    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  };

  // Extract video ID from various YouTube URL formats
  const extractVideoId = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return url; // Assume it's already a video ID
  };

  const finalVideoId = extractVideoId(videoId);
  const embedUrl = useMemo(() => buildYouTubeUrl(finalVideoId), [finalVideoId, autoplay, controls, muted, loop, startTime, endTime]);

  const globalTrack: PlayerTrack = useMemo(() => ({
    id: finalVideoId,
    title: title || `Stream`,
    artist: channelTitle || 'Creator',
    album_id: null,
    audio_url: `/api/surf/audio?videoId=${encodeURIComponent(finalVideoId)}`,
    cover_art: thumbnail,
    duration: endTime && startTime ? Math.max(0, endTime - startTime) : undefined,
  }), [channelTitle, endTime, finalVideoId, startTime, thumbnail, title]);

  const isCurrentVideo = current?.id === finalVideoId;

  const handleGlobalPlay = () => {
    if (!globalTrack.audio_url) return;

    const state = usePlayerStore.getState();
    const exists = state.queue.find(track => track.id === globalTrack.id);
    if (!exists) {
      state.addToQueue(globalTrack);
    }
    state.playTrack(globalTrack);
    onPlay?.();
  };

  const handleToggle = () => {
    if (isCurrentVideo && isPlaying) {
      pause();
      onPause?.();
      return;
    }
    handleGlobalPlay();
  };

  return (
    <div
      className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}
    >
      <MatrixIframe
        src={embedUrl}
        title={`Matrix Stream - ${finalVideoId}`}
        className="w-full h-full"
        matrixIntensity={matrixIntensity}
        showMatrixOverlay={showMatrixOverlay}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        onLoad={() => {
          setIsLoading(false);
          onReady?.();
        }}
        onError={() => setIsLoading(false)}
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
          >
            <div className="flex items-center gap-3 text-teal-300 font-mono">
              <Radio className="h-5 w-5 animate-spin" />
              <span>Initializing stream…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global player hook */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-3 rounded-lg bg-black/80 backdrop-blur border border-white/10 px-3 py-2">
        <div className="text-[11px] text-white/70 leading-tight">
          <div className="font-semibold text-white">Global player</div>
          <div className="text-white/60">
            {isCurrentVideo
              ? isPlaying
                ? 'Playing now'
                : 'Queued & ready'
              : 'Tap to route audio'}
          </div>
        </div>
        <button
          onClick={handleToggle}
          className="flex items-center justify-center rounded-full bg-teal-500 hover:bg-teal-400 text-black p-2 transition-colors"
        >
          {isCurrentVideo && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>

      {/* Video meta */}
      <div className="absolute bottom-3 left-3 z-20 rounded-lg bg-black/70 backdrop-blur border border-white/10 px-3 py-2">
        <div className="text-sm font-semibold text-white">{title || `Matrix stream`}</div>
        <div className="text-xs text-white/60">{channelTitle || 'Creator'}</div>
      </div>
      
      {/* Border */}
      <div className="absolute inset-0 rounded-lg border border-white/10 pointer-events-none" />
    </div>
  );
}

// Hook for YouTube player events (if needed for advanced integration)
export function useMatrixYouTubePlayer(videoId: string) {
  const [playerState, setPlayerState] = useState({
    isReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
  });

  const [matrixEffects, setMatrixEffects] = useState<{
    intensity: 'subtle' | 'medium' | 'strong';
    showOverlay: boolean;
    syncWithAudio: boolean;
  }>({
    intensity: 'medium',
    showOverlay: true,
    syncWithAudio: false,
  });

  // Sync Matrix effects with video state
  useEffect(() => {
    if (playerState.isPlaying && matrixEffects.syncWithAudio) {
      setMatrixEffects(prev => ({
        ...prev,
        intensity: 'strong',
      }));
    } else {
      setMatrixEffects(prev => ({
        ...prev,
        intensity: 'medium',
      }));
    }
  }, [playerState.isPlaying, matrixEffects.syncWithAudio]);

  return {
    playerState,
    setPlayerState,
    matrixEffects,
    setMatrixEffects,
  };
}
